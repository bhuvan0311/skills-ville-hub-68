import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const db = new PGlite();
const ids = {
  admin: "00000000-0000-4000-8000-000000000001",
  owner: "00000000-0000-4000-8000-000000000002",
  other: "00000000-0000-4000-8000-000000000003",
  teacher: "00000000-0000-4000-8000-000000000004",
  parent: "00000000-0000-4000-8000-000000000005",
  reception: "00000000-0000-4000-8000-000000000006",
  a: "10000000-0000-4000-8000-000000000001",
  b: "10000000-0000-4000-8000-000000000002",
  student: "20000000-0000-4000-8000-000000000001",
  otherStudent: "20000000-0000-4000-8000-000000000002",
  batch: "30000000-0000-4000-8000-000000000001",
  otherBatch: "30000000-0000-4000-8000-000000000002",
};
let passed = 0;
async function test(name, fn) {
  await fn();
  passed++;
  process.stdout.write(`PASS ${name}\n`);
}
async function as(user) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
  await db.exec("set role authenticated");
}
async function denied(sql, parameters = []) {
  await assert.rejects(() => db.query(sql, parameters));
}
const query = (sql, params = []) => db.query(sql, params);
const scalar = async (sql, params = []) =>
  Object.values((await query(sql, params)).rows[0])[0];

try {
  await db.exec(`create role authenticated; create role service_role; create role anon;
    alter default privileges in schema public grant execute on functions to anon,authenticated;
    create schema auth; create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);
  const original = await readFile(
    new URL("../docs/supabase-schema.sql", import.meta.url),
    "utf8",
  );
  await db.exec(
    process.argv.includes("--fresh")
      ? await readFile(
          new URL(
            "../supabase/migrations/202610110000_fresh_core.sql",
            import.meta.url,
          ),
          "utf8",
        )
      : original
          .slice(0, original.indexOf("-- Storage Bucket for Student Photos"))
          .replace(/-- =+\s*$/, ""),
  );
  await db.exec(
    "grant usage on schema public to authenticated; grant select,insert,update,delete on all tables in schema public to authenticated;",
  );
  await db.exec(
    await readFile(
      new URL("../supabase/migrations/202610110001_erp.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      new URL("../supabase/migrations/202610110002_exams.sql", import.meta.url),
      "utf8",
    ),
  );
  // Storage API is not emulated; these tables exercise PostgreSQL policies only.
  await db.exec(`create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets,name text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to authenticated,anon;
    grant select,insert,update,delete on storage.objects to authenticated,anon;`);
  for (const file of [
    "202610110003_private_photos.sql",
    "202610110004_catalogue_announcements.sql",
    "202610110005_function_access.sql",
  ])
    await db.exec(
      await readFile(
        new URL(`../supabase/migrations/${file}`, import.meta.url),
        "utf8",
      ),
    );
  await db.exec(`insert into auth.users(id) values ${["admin", "owner", "other", "teacher", "parent", "reception"].map((k) => `('${ids[k]}')`).join(",")};
    insert into public.franchises(id,franchise_code,name,city) values ('${ids.a}','A','Test A','Test'),('${ids.b}','B','Test B','Test');
    update public.profiles set franchise_id='${ids.a}' where id='${ids.owner}';
    update public.profiles set franchise_id='${ids.b}' where id='${ids.other}';
    insert into public.user_roles(user_id,role) values ('${ids.admin}','super_admin'),('${ids.owner}','franchise_owner'),('${ids.other}','franchise_owner');
    insert into public.batches(id,franchise_id,name,level) values ('${ids.batch}','${ids.a}','Test class',1),('${ids.otherBatch}','${ids.b}','Other class',1);
    insert into public.students(id,franchise_id,batch_id,full_name,parent_phone,level,status) values
      ('${ids.student}','${ids.a}','${ids.batch}','Test student','919999999999',1,'ACTIVE'),
      ('${ids.otherStudent}','${ids.b}','${ids.otherBatch}','Other student','918888888888',1,'ACTIVE');`);
  await as(ids.admin);
  for (const [user, role] of [
    [ids.teacher, "teacher"],
    [ids.parent, "parent"],
    [ids.reception, "receptionist"],
  ]) {
    await query("select public.erp_manage_membership($1,$2,$3,$4,true)", [
      ids.a,
      user,
      role,
      role,
    ]);
  }
  await query("select public.erp_link_parent($1,$2,$3)", [
    ids.a,
    ids.parent,
    ids.student,
  ]);
  const plan = await scalar(
    `insert into public.erp_fee_plans(franchise_id,label,amount_paise,installments) values ($1,'Test plan',10001,3) returning id`,
    [ids.a],
  );
  const rule = await scalar(
    `insert into public.erp_royalty_rules(franchise_id,label,basis_points,fixed_paise,effective_from) values ($1,'Test rule',1000,100,'2020-01-01') returning id`,
    [ids.a],
  );
  const item = await scalar(
    `insert into public.erp_stock_items(franchise_id,sku,name,unit_price_paise) values ($1,'TEST','Test stock',100) returning id`,
    [ids.a],
  );

  await test("Franchise owner cannot set fees, royalty rules or own tenancy", async () => {
    await as(ids.owner);
    await denied(
      `insert into public.erp_fee_plans(franchise_id,label,amount_paise,installments) values ($1,'Forbidden',100,1)`,
      [ids.a],
    );
    await denied(`update public.profiles set franchise_id=$1 where id=$2`, [
      ids.b,
      ids.owner,
    ]);
    assert.equal(
      await scalar("select count(*)::int from public.erp_royalty_rules"),
      1,
    );
    assert.equal(
      await scalar("select count(*)::int from public.erp_fee_plans"),
      1,
    );
  });
  await test("Plans create exact paise instalments and duplicate assignment rolls back", async () => {
    await scalar("select public.erp_assign_fee_plan($1,$2,$3)", [
      ids.student,
      plan,
      "2026-10-01",
    ]);
    assert.deepEqual(
      (
        await query(
          "select amount_paise::int from public.erp_invoices order by installment",
        )
      ).rows.map((r) => r.amount_paise),
      [3334, 3334, 3333],
    );
    await denied("select public.erp_assign_fee_plan($1,$2,$3)", [
      ids.student,
      plan,
      "2026-10-01",
    ]);
    assert.equal(
      await scalar("select count(*)::int from public.erp_invoices"),
      3,
    );
    await denied("select public.erp_assign_fee_plan($1,$2,$3)", [
      ids.otherStudent,
      plan,
      "2026-10-01",
    ]);
  });
  await test("Admissions convert once, atomically, into a real pending student", async () => {
    const lead = await scalar(
      `insert into public.erp_leads(franchise_id,full_name,parent_name,phone) values ($1,'Test enquiry','Test parent','919999999999') returning id`,
      [ids.a],
    );
    const student = await scalar("select public.erp_enroll_lead($1)", [lead]);
    assert.equal(
      await scalar("select public.erp_enroll_lead($1)", [lead]),
      student,
    );
    assert.equal(
      await scalar("select status::text from public.students where id=$1", [
        student,
      ]),
      "PENDING",
    );
    assert.equal(
      await scalar("select status from public.erp_leads where id=$1", [lead]),
      "ENROLLED",
    );
  });
  const invoice = await scalar(
    "select id from public.erp_invoices order by installment limit 1",
  );
  await test("Tenant B cannot read Tenant A fees or invoke its money RPCs", async () => {
    await as(ids.other);
    assert.equal(
      await scalar("select count(*)::int from public.erp_invoices"),
      0,
    );
    await denied("select public.erp_assign_fee_plan($1,$2,$3)", [
      ids.student,
      plan,
      "2026-10-01",
    ]);
  });
  let claim;
  await test("Parent sees only linked records and submits a pending payment", async () => {
    await as(ids.parent);
    assert.equal(await scalar("select count(*)::int from public.students"), 1);
    assert.equal(
      await scalar("select count(*)::int from public.erp_invoices"),
      3,
    );
    claim = await scalar(
      `insert into public.erp_payment_claims(franchise_id,invoice_id,amount_paise,reference,method) values ($1,$2,3334,'TEST-REF-001','UPI') returning id`,
      [ids.a, invoice],
    );
    await denied("select public.erp_verify_payment($1,true)", [claim]);
    await denied(
      `insert into public.erp_payment_claims(franchise_id,invoice_id,amount_paise,reference,method,status) values ($1,$2,1,'TEST-REF-FAKE','UPI','VERIFIED')`,
      [ids.a, invoice],
    );
    await denied(
      `insert into public.erp_expenses(franchise_id,category,description,amount_paise,expense_date,reference) values ($1,'X','Forbidden',1,current_date,'X')`,
      [ids.a],
    );
  });
  await test("Verified payment issues one immutable receipt and retry is idempotent", async () => {
    await as(ids.owner);
    const first = await scalar("select public.erp_verify_payment($1,true)", [
      claim,
    ]);
    assert.equal(
      await scalar("select public.erp_verify_payment($1,true)", [claim]),
      first,
    );
    assert.equal(
      await scalar("select count(*)::int from public.erp_payments"),
      1,
    );
    await denied("update public.erp_payments set amount_paise=1 where id=$1", [
      first,
    ]);
    await denied("delete from public.erp_payments where id=$1", [first]);
  });
  await test("Overpayment does not issue a receipt or verify the claim", async () => {
    const over = await scalar(
      `insert into public.erp_payment_claims(franchise_id,invoice_id,amount_paise,reference,method) values ($1,$2,1,'TEST-OVERPAY','UPI') returning id`,
      [ids.a, invoice],
    );
    await denied("select public.erp_verify_payment($1,true)", [over]);
    assert.equal(
      await scalar("select status from public.erp_payment_claims where id=$1", [
        over,
      ]),
      "PENDING",
    );
  });
  await test("Only Head Office approves a discount and cannot discount paid money", async () => {
    const request = await scalar(
      `insert into public.erp_discount_requests(franchise_id,invoice_id,amount_paise,reason) values ($1,$2,1,'Test') returning id`,
      [ids.a, invoice],
    );
    await denied("select public.erp_decide_discount($1,true)", [request]);
    await as(ids.admin);
    await denied("select public.erp_decide_discount($1,true)", [request]);
  });
  await test("Stock movements reject negative balances and duplicated references", async () => {
    await as(ids.owner);
    await scalar("select public.erp_record_stock($1,5,$2,$3)", [
      item,
      "Opening stock",
      "OPEN",
    ]);
    await denied("select public.erp_record_stock($1,-6,$2,$3)", [
      item,
      "Issue",
      "ISSUE",
    ]);
    await denied("select public.erp_record_stock($1,5,$2,$3)", [
      item,
      "Duplicate",
      "OPEN",
    ]);
    assert.equal(
      await scalar(
        "select sum(quantity_delta)::int from public.erp_stock_movements",
      ),
      5,
    );
  });
  await test("Procurement receipt creates one stock movement", async () => {
    const request = await scalar(
      `insert into public.erp_procurement(franchise_id,item_id,quantity) values ($1,$2,3) returning id`,
      [ids.a, item],
    );
    await denied("select public.erp_decide_procurement($1,$2)", [
      request,
      "RECEIVED",
    ]);
    await query("select public.erp_decide_procurement($1,$2)", [
      request,
      "APPROVED",
    ]);
    await query("select public.erp_decide_procurement($1,$2)", [
      request,
      "RECEIVED",
    ]);
    await denied("select public.erp_decide_procurement($1,$2)", [
      request,
      "RECEIVED",
    ]);
    assert.equal(
      await scalar(
        "select sum(quantity_delta)::int from public.erp_stock_movements",
      ),
      8,
    );
  });
  const sessions = [];
  await test("Timetable rejects room/teacher clashes and cross-franchise relations", async () => {
    sessions.push(
      await scalar(
        `insert into public.erp_class_sessions(franchise_id,batch_id,teacher_user_id,room,level,starts_at,ends_at,status) values ($1,$2,$3,'Room A',1,'2026-01-01 10:00+05:30','2026-01-01 11:00+05:30','COMPLETED') returning id`,
        [ids.a, ids.batch, ids.teacher],
      ),
    );
    await denied(
      `insert into public.erp_class_sessions(franchise_id,batch_id,teacher_user_id,room,level,starts_at,ends_at) values ($1,$2,$3,'Room B',1,'2026-01-01 10:30+05:30','2026-01-01 11:30+05:30')`,
      [ids.a, ids.batch, ids.teacher],
    );
    await denied(
      `insert into public.erp_class_sessions(franchise_id,batch_id,teacher_user_id,room,level,starts_at,ends_at) values ($1,$2,$3,'Room B',1,'2026-01-03 10:00+05:30','2026-01-03 11:00+05:30')`,
      [ids.a, ids.otherBatch, ids.teacher],
    );
  });
  await test("12 actual class attendances required, with no duplicate or direct bypass", async () => {
    await denied("select public.erp_progress_student($1)", [ids.student]);
    await denied("update public.students set level=2 where id=$1", [
      ids.student,
    ]);
    for (let i = 2; i <= 12; i++)
      sessions.push(
        await scalar(
          `insert into public.erp_class_sessions(franchise_id,batch_id,teacher_user_id,room,level,starts_at,ends_at,status) values ($1,$2,$3,'Room A',1,$4,$5,'COMPLETED') returning id`,
          [
            ids.a,
            ids.batch,
            ids.teacher,
            `2026-01-${String(i).padStart(2, "0")} 10:00+05:30`,
            `2026-01-${String(i).padStart(2, "0")} 11:00+05:30`,
          ],
        ),
      );
    await as(ids.teacher);
    assert.equal(
      (
        await query(
          "update public.students set status='DROPOUT' where id=$1 returning id",
          [ids.student],
        )
      ).rows.length,
      0,
    );
    for (const session of sessions)
      await query(
        "insert into public.erp_attendance(franchise_id,session_id,student_id,level,present) values ($1,$2,$3,1,true)",
        [ids.a, session, ids.student],
      );
    await denied(
      "insert into public.erp_attendance(franchise_id,session_id,student_id,level,present) values ($1,$2,$3,1,true)",
      [ids.a, sessions[0], ids.student],
    );
    await denied("select public.erp_progress_student($1)", [ids.student]);
    await as(ids.owner);
    assert.equal(
      await scalar("select public.erp_progress_student($1)", [ids.student]),
      2,
    );
    await denied("select public.erp_progress_student($1)", [ids.student]);
    assert.equal(
      await scalar("select count(*)::int from public.erp_progressions"),
      1,
    );
  });
  await test("Exam failures do not fabricate certificates or passing marks", async () => {
    await as(ids.owner);
    await denied(
      `insert into public.exam_results(student_id,franchise_id,level,marks_obtained,is_passed,certificate_status) values ($1,$2,2,20,true,'PENDING')`,
      [ids.student, ids.a],
    );
    await query(
      `insert into public.exam_results(student_id,franchise_id,level,marks_obtained,is_passed,certificate_status) values ($1,$2,2,20,false,null)`,
      [ids.student, ids.a],
    );
    assert.equal(
      await scalar(
        "select count(*)::int from public.exam_results where is_passed",
      ),
      0,
    );
  });
  await test("Royalty statements use configured rates and reject overlapping periods", async () => {
    await denied("select public.erp_generate_royalty($1,$2,$3)", [
      rule,
      "2020-01-01",
      "2030-01-01",
    ]);
    await as(ids.admin);
    const statement = await scalar(
      "select public.erp_generate_royalty($1,$2,$3)",
      [rule, "2020-01-01", "2030-01-01"],
    );
    assert.equal(
      Number(
        await scalar(
          "select amount_paise from public.erp_royalty_statements where id=$1",
          [statement],
        ),
      ),
      433,
    );
    await denied("select public.erp_generate_royalty($1,$2,$3)", [
      rule,
      "2026-01-01",
      "2026-12-31",
    ]);
  });
  await test("Audit entries are written by the database and not editable by staff", async () => {
    await as(ids.owner);
    assert.ok((await scalar("select count(*)::int from public.erp_audit")) > 0);
    await denied("delete from public.erp_audit");
    await denied(
      "insert into public.erp_audit(franchise_id,actor_id,entity,record_id,operation,changed_fields) values ($1,$2,'fake',$3,'UPDATE',array['fake'])",
      [ids.a, ids.owner, ids.student],
    );
  });
  await test("Photos remain private and cannot cross franchises or be changed by parents", async () => {
    const path = `${ids.a}/${ids.student}.jpg`;
    await as(ids.owner);
    await query(
      "insert into storage.objects(bucket_id,name) values ('student-photos',$1)",
      [path],
    );
    assert.equal(await scalar("select count(*)::int from storage.objects"), 1);
    await denied(
      "insert into storage.objects(bucket_id,name) values ('student-photos',$1)",
      [`${ids.b}/${ids.otherStudent}.jpg`],
    );
    await as(ids.other);
    assert.equal(await scalar("select count(*)::int from storage.objects"), 0);
    await as(ids.parent);
    assert.equal(await scalar("select count(*)::int from storage.objects"), 1);
    await denied(
      "insert into storage.objects(bucket_id,name) values ('student-photos',$1)",
      [path],
    );
    assert.equal(
      (
        await query(
          "update storage.objects set name='malformed.jpg' returning id",
        )
      ).rows.length,
      0,
    );
    await db.exec("reset role; set role anon");
    assert.equal(await scalar("select count(*)::int from storage.objects"), 0);
    await db.exec("reset role");
    assert.equal(
      await scalar(
        "select public from storage.buckets where id='student-photos'",
      ),
      false,
    );
  });
  await test("Only Head Office manages the retained catalogue and authentic announcement authors", async () => {
    await as(ids.admin);
    await query(
      "insert into public.products(name,price,category) values ('Test product',100,'kit')",
    );
    await query(
      "insert into public.broadcasts(title,message,created_by) values ('Test','Test',$1)",
      [ids.admin],
    );
    await denied(
      "insert into public.broadcasts(title,message,created_by) values ('Fake','Fake',$1)",
      [ids.owner],
    );
    await as(ids.owner);
    assert.equal(await scalar("select count(*)::int from public.products"), 1);
    await denied(
      "insert into public.products(name,price,category) values ('Forbidden',1,'kit')",
    );
    await denied(
      "insert into public.broadcasts(title,message,created_by) values ('Forbidden','Forbidden',$1)",
      [ids.owner],
    );
    await db.exec("reset role; set role anon");
    await denied("select * from public.products");
    await denied("select * from public.broadcasts");
  });
  await test("Anonymous RPCs and cross-account legacy helper lookups are blocked", async () => {
    await db.exec("reset role; set role anon");
    await denied("select public.erp_progress_student($1)", [ids.student]);
    assert.equal(
      await scalar(
        "select has_function_privilege('anon','public.erp_verify_payment(uuid,boolean)','execute')",
      ),
      false,
    );
    await as(ids.owner);
    assert.equal(
      await scalar("select public.get_user_franchise_id($1)", [ids.other]),
      null,
    );
    assert.equal(
      await scalar("select public.has_role($1,'super_admin')", [ids.admin]),
      false,
    );
  });
  process.stdout.write(
    `\n${passed} database integration checks passed. Test records are in an ephemeral database only.\n`,
  );
  await db.exec("reset role");
  await db.exec(
    await readFile(new URL("./staging-sql-check.sql", import.meta.url), "utf8"),
  );
  process.stdout.write("Staging rollback SQL script also passed locally.\n");
} catch (error) {
  process.stderr.write(
    `${error.message}\n${error.detail || ""}\n${error.where || ""}\n${error.internalQuery || ""}\nPosition: ${error.position || error.internalPosition || "unknown"}\n`,
  );
  process.exitCode = 1;
} finally {
  await db.close();
}
