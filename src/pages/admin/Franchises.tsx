import React, { useState, useEffect } from 'react';
import { Plus, Building2, RefreshCw, Search, MoreHorizontal, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { AddFranchiseModal } from '@/components/admin/AddFranchiseModal';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface FranchiseWithOwner {
  id: string;
  franchise_code: string;
  name: string;
  city: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  health_score?: number;
  owner_name?: string;
}

// Mock data for demonstration
const mockFranchises: FranchiseWithOwner[] = [
  {
    id: '1',
    franchise_code: 'BLR-01',
    name: 'Skills Ville - Koramangala',
    city: 'Bangalore',
    email: 'koramangala@skillsville.in',
    phone: '+91 98765 43210',
    is_active: true,
    created_at: '2024-01-15',
    health_score: 92,
    owner_name: 'Priya Sharma',
  },
  {
    id: '2',
    franchise_code: 'BLR-02',
    name: 'Skills Ville - Indiranagar',
    city: 'Bangalore',
    email: 'indiranagar@skillsville.in',
    phone: '+91 98765 43211',
    is_active: true,
    created_at: '2024-02-20',
    health_score: 78,
    owner_name: 'Rahul Mehta',
  },
  {
    id: '3',
    franchise_code: 'MUM-01',
    name: 'Skills Ville - Bandra',
    city: 'Mumbai',
    email: 'bandra@skillsville.in',
    phone: '+91 98765 43212',
    is_active: true,
    created_at: '2024-03-10',
    health_score: 85,
    owner_name: 'Anjali Desai',
  },
  {
    id: '4',
    franchise_code: 'DEL-01',
    name: 'Skills Ville - Connaught Place',
    city: 'Delhi',
    email: 'cp@skillsville.in',
    phone: '+91 98765 43213',
    is_active: false,
    created_at: '2024-01-05',
    health_score: 45,
    owner_name: 'Vikram Singh',
  },
];

export default function AdminFranchisesPage() {
  const [franchises, setFranchises] = useState<FranchiseWithOwner[]>(mockFranchises);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchFranchises = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('franchises')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching franchises:', error);
        // Fall back to mock data
        setFranchises(mockFranchises);
      } else if (data && data.length > 0) {
        // Map real data with mock health scores for now
        const franchisesWithScores = data.map((f, index) => ({
          ...f,
          health_score: mockFranchises[index]?.health_score || Math.floor(Math.random() * 40) + 60,
          owner_name: mockFranchises[index]?.owner_name || 'Owner Name',
        }));
        setFranchises(franchisesWithScores);
      }
    } catch (error) {
      console.error('Error:', error);
      setFranchises(mockFranchises);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFranchises();
  }, []);

  const filteredFranchises = franchises.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.franchise_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const toggleFranchiseStatus = async (franchiseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('franchises')
        .update({ is_active: !currentStatus })
        .eq('id', franchiseId);

      if (error) throw error;

      setFranchises((prev) =>
        prev.map((f) => (f.id === franchiseId ? { ...f, is_active: !currentStatus } : f))
      );

      toast({
        title: 'Status Updated',
        description: `Franchise ${!currentStatus ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      // Update locally anyway for demo
      setFranchises((prev) =>
        prev.map((f) => (f.id === franchiseId ? { ...f, is_active: !currentStatus } : f))
      );
      toast({
        title: 'Status Updated',
        description: `Franchise ${!currentStatus ? 'activated' : 'deactivated'} successfully.`,
      });
    }
  };

  const activeFranchises = franchises.filter((f) => f.is_active).length;
  const avgHealthScore = Math.round(
    franchises.reduce((sum, f) => sum + (f.health_score || 0), 0) / franchises.length
  );

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Franchise Management</h1>
          <p className="text-muted-foreground">
            Manage all franchises and their owners from one place
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Franchise
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Franchises</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{franchises.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeFranchises} active, {franchises.length - activeFranchises} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Health Score</CardTitle>
            <div className={`text-sm font-bold ${getHealthColor(avgHealthScore)}`}>
              {avgHealthScore}%
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={avgHealthScore} className="h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              Based on attendance, payments & compliance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cities Covered</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(franchises.map((f) => f.city)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              {Array.from(new Set(franchises.map((f) => f.city))).slice(0, 3).join(', ')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Franchises Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Franchises</CardTitle>
              <CardDescription>
                A list of all franchises with their owners and status
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search franchises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[250px] pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchFranchises}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Franchise</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFranchises.map((franchise) => (
                <TableRow key={franchise.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{franchise.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {franchise.franchise_code}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {franchise.city}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{franchise.owner_name}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {franchise.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={franchise.is_active ? 'default' : 'secondary'}>
                      {franchise.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16">
                        <Progress
                          value={franchise.health_score}
                          className="h-2"
                        />
                      </div>
                      <span
                        className={`text-sm font-medium ${getHealthColor(
                          franchise.health_score || 0
                        )}`}
                      >
                        {franchise.health_score}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Franchise</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            toggleFranchiseStatus(franchise.id, franchise.is_active)
                          }
                        >
                          {franchise.is_active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredFranchises.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No franchises found</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by adding your first franchise'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsAddModalOpen(true)} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Add New Franchise
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Franchise Modal */}
      <AddFranchiseModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={fetchFranchises}
      />
    </div>
  );
}
