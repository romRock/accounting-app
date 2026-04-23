'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store';
import { formatDate } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  role: {
    id: string;
    name: string;
    description?: string;
  };
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, boolean>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface City {
  id: string;
  name: string;
  code: string;
  state?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Party {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  panNumber?: string;
  gstNumber?: string;
  city: {
    name: string;
    code: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function MasterDataPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'cities' | 'parties' | 'branches'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchMasterData();
  }, [isAuthenticated, router]);

  const fetchMasterData = async () => {
    try {
      setLoading(true);
      
      // Fetch data based on active tab
      let endpoint = '';
      switch (activeTab) {
        case 'users':
          endpoint = '/api/master/users';
          break;
        case 'roles':
          endpoint = '/api/master/roles';
          break;
        case 'cities':
          endpoint = '/api/master/cities';
          break;
        case 'parties':
          endpoint = '/api/master/parties';
          break;
        case 'branches':
          endpoint = '/api/master/branches';
          break;
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        switch (activeTab) {
          case 'users':
            setUsers(data.users || []);
            break;
          case 'roles':
            setRoles(data.roles || []);
            break;
          case 'cities':
            setCities(data.cities || []);
            break;
          case 'parties':
            setParties(data.parties || []);
            break;
          case 'branches':
            setBranches(data.branches || []);
            break;
        }
      }
    } catch (error) {
      console.error('Failed to fetch master data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading master data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Data Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, cities, parties, and branches
          </p>
        </div>
        <Button onClick={fetchMasterData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-0">
          <div className="flex space-x-1 p-1">
            {[
              { id: 'users', name: 'Users', icon: '👥' },
              { id: 'roles', name: 'Roles', icon: '🔐' },
              { id: 'cities', name: 'Cities', icon: '🏙️' },
              { id: 'parties', name: 'Parties', icon: '👤' },
              { id: 'branches', name: 'Branches', icon: '🏢' },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center space-x-2"
              >
                <span>{tab.icon}</span>
                {tab.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      <Card>
        <CardHeader>
          <CardTitle className="capitalize">{activeTab}</CardTitle>
          <CardDescription>
            Manage {activeTab} in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeTab === 'users' && (
            <div className="space-y-4">
              {users.length === 0 ? (
                <Alert>
                  <AlertDescription>No users found</AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Branch
                        </th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="border border-gray-200 px-4 py-3 text-sm">
                            {user.firstName} {user.lastName}
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-sm">
                            {user.email}
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-sm">
                            {user.role.name}
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-sm">
                            {user.branch?.name || 'N/A'}
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-sm">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">Edit</Button>
                              <Button size="sm" variant="destructive">Delete</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-4">
                <Button>Add New User</Button>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-4">
              {roles.length === 0 ? (
                <Alert>
                  <AlertDescription>No roles found</AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {roles.map((role) => (
                    <div key={role.id} className="border rounded-lg p-4">
                      <h3 className="font-medium">{role.name}</h3>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                      <div className="mt-2">
                        <h4 className="text-sm font-medium">Permissions:</h4>
                        <div className="mt-1 space-y-1">
                          {Object.entries(role.permissions).map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-2">
                              <span className="text-sm">{key}</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {value ? 'Yes' : 'No'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="destructive">Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button>Add New Role</Button>
              </div>
            </div>
          )}

          {activeTab === 'cities' && (
            <div className="space-y-4">
              {cities.length === 0 ? (
                <Alert>
                  <AlertDescription>No cities found</AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {cities.map((city) => (
                    <div key={city.id} className="border rounded-lg p-4">
                      <h3 className="font-medium">{city.name}</h3>
                      <p className="text-sm text-muted-foreground">Code: {city.code}</p>
                      {city.state && (
                        <p className="text-sm text-muted-foreground">State: {city.state}</p>
                      )}
                      <div className="mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          city.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {city.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="destructive">Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button>Add New City</Button>
              </div>
            </div>
          )}

          {activeTab === 'parties' && (
            <div className="space-y-4">
              {parties.length === 0 ? (
                <Alert>
                  <AlertDescription>No parties found</AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {parties.map((party) => (
                    <div key={party.id} className="border rounded-lg p-4">
                      <h3 className="font-medium">{party.name}</h3>
                      <p className="text-sm text-muted-foreground">City: {party.city.name}</p>
                      {party.phone && (
                        <p className="text-sm text-muted-foreground">Phone: {party.phone}</p>
                      )}
                      {party.email && (
                        <p className="text-sm text-muted-foreground">Email: {party.email}</p>
                      )}
                      {party.address && (
                        <p className="text-sm text-muted-foreground">Address: {party.address}</p>
                      )}
                      {party.panNumber && (
                        <p className="text-sm text-muted-foreground">PAN: {party.panNumber}</p>
                      )}
                      {party.gstNumber && (
                        <p className="text-sm text-muted-foreground">GST: {party.gstNumber}</p>
                      )}
                      <div className="mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          party.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {party.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="destructive">Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button>Add New Party</Button>
              </div>
            </div>
          )}

          {activeTab === 'branches' && (
            <div className="space-y-4">
              {branches.length === 0 ? (
                <Alert>
                  <AlertDescription>No branches found</AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {branches.map((branch) => (
                    <div key={branch.id} className="border rounded-lg p-4">
                      <h3 className="font-medium">{branch.name}</h3>
                      <p className="text-sm text-muted-foreground">Code: {branch.code}</p>
                      {branch.address && (
                        <p className="text-sm text-muted-foreground">Address: {branch.address}</p>
                      )}
                      {branch.phone && (
                        <p className="text-sm text-muted-foreground">Phone: {branch.phone}</p>
                      )}
                      {branch.email && (
                        <p className="text-sm text-muted-foreground">Email: {branch.email}</p>
                      )}
                      <div className="mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          branch.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {branch.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="destructive">Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button>Add New Branch</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
