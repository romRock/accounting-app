'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store';
import { formatDate } from '@/lib/utils';
import { transactionApi } from '@/lib/transactions';

// Data Interfaces
interface User {
  id: string;
  fullName: string;
  username: string;
  mobileNumber: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  roleId: string;
  centerId: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: {
    transactions: {
      view: boolean;
      add: boolean;
      edit: boolean;
      delete: boolean;
    };
    reports: {
      view: boolean;
      export: boolean;
    };
    balanceSheet: {
      view: boolean;
      export: boolean;
    };
    master: {
      fullAccess: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface Center {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  contactNumber: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

interface Client {
  id: string;
  name: string;
  mobileNumber: string;
  city: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function MasterPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'centers' | 'clients'>('users');
  
  // Form states
  const [userForm, setUserForm] = useState<Partial<User>>({});
  const [roleForm, setRoleForm] = useState<Partial<Role>>({});
  const [centerForm, setCenterForm] = useState<Partial<Center>>({});
  const [clientForm, setClientForm] = useState<Partial<Client>>({});
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [centersLoading, setCentersLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user is admin
  const isAdmin = (user && user.role.name === 'Super Admin') || (user && user.username === 'admin');

  // Load real centers data
  const loadCenters = async () => {
    try {
      console.log("=== MASTER PAGE: Loading centers ===");
      setCentersLoading(true);
      
      // Test API call with debugging
      console.log("Calling transactionApi.searchCities...");
      const cities = await transactionApi.searchCities(''); // Get all cities without limit
      console.log("API returned cities:", cities.length, cities);
      
      const centersData: Center[] = cities.map((city, index) => ({
        id: city.id,
        name: city.name,
        code: city.code,
        city: city.state,
        address: city.address || `${city.name}, ${city.state}`,
        contactNumber: city.number || 'N/A',
        status: 'Active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      console.log("Transformed centers data:", centersData);
      setCenters(centersData);
    } catch (error) {
      console.error("Error loading centers:", error);
      setCenters([]); // Set empty array on error
    } finally {
      setCentersLoading(false);
    }
  };

  // Load real clients data
  const loadClients = async () => {
    try {
      console.log("=== MASTER PAGE: Loading clients ===");
      
      const clientsData = await transactionApi.getClients();
      console.log("API returned clients:", clientsData.length, clientsData);
      
      setClients(clientsData);
    } catch (error) {
      console.error("Error loading clients:", error);
      setClients([]); // Set empty array on error
    }
  };

  // Generate mock data
  const generateMockData = () => {
    // Mock roles
    const mockRoles: Role[] = [
      {
        id: '1',
        name: 'Super Admin',
        description: 'Full system access',
        permissions: {
          transactions: { view: true, add: true, edit: true, delete: true },
          reports: { view: true, export: true },
          balanceSheet: { view: true, export: true },
          master: { fullAccess: true }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Manager',
        description: 'Branch manager access',
        permissions: {
          transactions: { view: true, add: true, edit: true, delete: false },
          reports: { view: true, export: true },
          balanceSheet: { view: true, export: false },
          master: { fullAccess: false }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Operator',
        description: 'Basic operator access',
        permissions: {
          transactions: { view: true, add: true, edit: false, delete: false },
          reports: { view: true, export: false },
          balanceSheet: { view: false, export: false },
          master: { fullAccess: false }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Mock users
    const mockUsers: User[] = [
      {
        id: '1',
        fullName: 'Admin User',
        username: 'admin',
        mobileNumber: '+91-9876543210',
        email: 'admin@example.com',
        roleId: '1',
        centerId: '1',
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        fullName: 'John Manager',
        username: 'john.manager',
        mobileNumber: '+91-9876543211',
        email: 'john@example.com',
        roleId: '2',
        centerId: '1',
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Mock clients removed - will use database data

    setRoles(mockRoles);
    setUsers(mockUsers);
    setClients([]);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    generateMockData();
    loadCenters(); // Load real centers data
    loadClients(); // Load real clients data
  }, [isAuthenticated, router]);

  // Listen for tab changes from header
  useEffect(() => {
    const handleTabChange = (e: CustomEvent) => {
      setActiveTab(e.detail);
    };

    window.addEventListener('setMasterTab', handleTabChange as EventListener);
    return () => window.removeEventListener('setMasterTab', handleTabChange as EventListener);
  }, []);

  // CRUD operations
  const handleAdd = () => {
    switch (activeTab) {
      case 'users':
        if (userForm.fullName && userForm.username && userForm.mobileNumber && userForm.roleId && userForm.centerId) {
          const newUser: User = {
            ...userForm as User,
            id: Date.now().toString(),
            status: 'Active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setUsers([...users, newUser]);
          setUserForm({});
        }
        break;
      case 'roles':
        if (roleForm.name && roleForm.description) {
          const newRole: Role = {
            id: Date.now().toString(),
            name: roleForm.name,
            description: roleForm.description,
            permissions: roleForm.permissions || {
              transactions: { view: false, add: false, edit: false, delete: false },
              reports: { view: false, export: false },
              balanceSheet: { view: false, export: false },
              master: { fullAccess: false }
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setRoles([...roles, newRole]);
          setRoleForm({});
        }
        break;
      case 'centers':
        if (centerForm.name && centerForm.code && centerForm.city) {
          // Only admins can add cities
          if (!isAdmin) {
            alert('Only administrators can add new cities');
            return;
          }

          const addNewCity = async () => {
            try {
              setLoading(true);
              const newCity = await transactionApi.addCity(
                centerForm.name!,
                centerForm.code!,
                centerForm.city!,
                centerForm.contactNumber || undefined
              );

              // Convert to Center format and add to local state
              const newCenter: Center = {
                id: newCity.id,
                name: newCity.name,
                code: newCity.code,
                city: newCity.state,
                address: newCity.address || `${newCity.name}, ${newCity.state}`,
                contactNumber: newCity.number || 'N/A',
                status: 'Active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };

              setCenters([...centers, newCenter]);
              setCenterForm({});
              alert('City added successfully!');
            } catch (error) {
              console.error('Error adding city:', error);
              alert(error instanceof Error ? error.message : 'Failed to add city');
            } finally {
              setLoading(false);
            }
          };

          addNewCity();
        }
        break;
      case 'clients':
        if (clientForm.name && clientForm.mobileNumber && clientForm.city) {
          // Only admins can add clients
          if (!isAdmin) {
            alert('Only administrators can add new clients');
            return;
          }

          const addNewClient = async () => {
            try {
              setLoading(true);
              const newClient = await transactionApi.addClient(
                clientForm.name!,
                clientForm.mobileNumber!,
                clientForm.city!,
                clientForm.notes
              );

              // Convert to Client format and add to local state
              const clientData: Client = {
                id: newClient.id,
                name: newClient.name,
                mobileNumber: newClient.mobileNumber,
                city: newClient.city,
                notes: newClient.notes,
                createdAt: newClient.createdAt,
                updatedAt: newClient.updatedAt
              };

              setClients([...clients, clientData]);
              setClientForm({});
              alert('Client added successfully!');
            } catch (error) {
              console.error('Error adding client:', error);
              alert(error instanceof Error ? error.message : 'Failed to add client');
            } finally {
              setLoading(false);
            }
          };

          addNewClient();
        }
        break;
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    switch (activeTab) {
      case 'users':
        setUserForm(item);
        break;
      case 'roles':
        setRoleForm(item);
        break;
      case 'centers':
        setCenterForm(item);
        break;
      case 'clients':
        setClientForm(item);
        break;
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      switch (activeTab) {
        case 'users':
          setUsers(users.filter(u => u.id !== id));
          break;
        case 'roles':
          setRoles(roles.filter(r => r.id !== id));
          break;
        case 'centers':
          // Only admins can delete cities
          if (!isAdmin) {
            alert('Only administrators can delete cities');
            return;
          }

          const deleteCity = async () => {
            try {
              setLoading(true);
              await transactionApi.deleteCity(id);
              setCenters(centers.filter(c => c.id !== id));
              alert('City deleted successfully!');
            } catch (error) {
              console.error('Error deleting city:', error);
              alert(error instanceof Error ? error.message : 'Failed to delete city');
            } finally {
              setLoading(false);
            }
          };

          deleteCity();
          break;
        case 'clients':
          // Only admins can delete clients
          if (!isAdmin) {
            alert('Only administrators can delete clients');
            return;
          }

          const deleteClient = async () => {
            try {
              setLoading(true);
              await transactionApi.deleteClient(id);
              setClients(clients.filter(c => c.id !== id));
              alert('Client deleted successfully!');
            } catch (error) {
              console.error('Error deleting client:', error);
              alert(error instanceof Error ? error.message : 'Failed to delete client');
            } finally {
              setLoading(false);
            }
          };

          deleteClient();
          break;
      }
    }
  };

  const handleUpdate = () => {
    if (!editingId) return;
    
    switch (activeTab) {
      case 'users':
        setUsers(users.map(u => u.id === editingId ? { ...userForm as User, id: editingId } : u));
        break;
      case 'roles':
        setRoles(roles.map(r => r.id === editingId ? { ...roleForm as Role, id: editingId } : r));
        break;
      case 'centers':
        // Only admins can update cities
        if (!isAdmin) {
          alert('Only administrators can update cities');
          return;
        }

        const updateCity = async () => {
          try {
            setLoading(true);
            const updatedCity = await transactionApi.updateCity(
              editingId!,
              centerForm.name!,
              centerForm.code!,
              centerForm.city!,
              centerForm.contactNumber || undefined
            );

            // Convert to Center format and update local state
            const updatedCenter: Center = {
              id: updatedCity.id,
              name: updatedCity.name,
              code: updatedCity.code,
              city: updatedCity.state,
              address: updatedCity.address || `${updatedCity.name}, ${updatedCity.state}`,
              contactNumber: updatedCity.number || 'N/A',
              status: 'Active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            setCenters(centers.map(c => c.id === editingId ? updatedCenter : c));
            alert('City updated successfully!');
          } catch (error) {
            console.error('Error updating city:', error);
            alert(error instanceof Error ? error.message : 'Failed to update city');
          } finally {
            setLoading(false);
          }
        };

        updateCity();
        break;
      case 'clients':
        // Only admins can update clients
        if (!isAdmin) {
          alert('Only administrators can update clients');
          return;
        }

        const updateClient = async () => {
          try {
            setLoading(true);
            const updatedClient = await transactionApi.updateClient(
              editingId!,
              clientForm.name!,
              clientForm.mobileNumber!,
              clientForm.city!,
              clientForm.notes
            );

            // Convert to Client format and update local state
            const clientData: Client = {
              id: updatedClient.id,
              name: updatedClient.name,
              mobileNumber: updatedClient.mobileNumber,
              city: updatedClient.city,
              notes: updatedClient.notes,
              createdAt: updatedClient.createdAt,
              updatedAt: updatedClient.updatedAt
            };

            setClients(clients.map(c => c.id === editingId ? clientData : c));
            alert('Client updated successfully!');
          } catch (error) {
            console.error('Error updating client:', error);
            alert(error instanceof Error ? error.message : 'Failed to update client');
          } finally {
            setLoading(false);
          }
        };

        updateClient();
        break;
    }
    setEditingId(null);
    setUserForm({});
    setRoleForm({});
    setCenterForm({});
    setClientForm({});
  };

  const handleClear = () => {
    setEditingId(null);
    setUserForm({});
    setRoleForm({});
    setCenterForm({});
    setClientForm({});
  };

  // Filter data based on search
  const filteredUsers = () => users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.mobileNumber.includes(searchTerm)
  );

  const filteredRoles = () => roles.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCenters = () => centers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClients = () => clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobileNumber.includes(searchTerm) ||
    c.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFilteredData = () => {
    switch (activeTab) {
      case 'users': return filteredUsers();
      case 'roles': return filteredRoles();
      case 'centers': return filteredCenters();
      case 'clients': return filteredClients();
      default: return [];
    }
  };

  return (
    <div className="bg-white min-h-screen w-full">
      <div className="pt-16 space-y-4 sm:space-y-6">

        {/* Tab Content */}
        <Card className="shadow-sm border-gray-200 bg-gray-100">
          <CardContent className="p-6">
            
            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* User Form */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {editingId ? 'Edit User' : 'Add New User'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name</Label>
                      <Input
                        id="fullName"
                        value={userForm.fullName || ''}
                        onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
                      <Input
                        id="username"
                        value={userForm.username || ''}
                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                        placeholder="Enter username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="mobileNumber" className="text-sm font-medium text-gray-700">Mobile Number</Label>
                      <Input
                        id="mobileNumber"
                        value={userForm.mobileNumber || ''}
                        onChange={(e) => setUserForm({ ...userForm, mobileNumber: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                        placeholder="Enter mobile number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email (Optional)</Label>
                      <Input
                        id="email"
                        value={userForm.email || ''}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={userForm.password || ''}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                        placeholder="Enter password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={userForm.confirmPassword || ''}
                        onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                        placeholder="Confirm password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="roleId" className="text-sm font-medium text-gray-700">Role</Label>
                      <select
                        id="roleId"
                        value={userForm.roleId || ''}
                        onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
                        className="w-full h-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-sm mt-1"
                      >
                        <option value="">Select Role</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="centerId" className="text-sm font-medium text-gray-700">Center</Label>
                      <select
                        id="centerId"
                        value={userForm.centerId || ''}
                        onChange={(e) => setUserForm({ ...userForm, centerId: e.target.value })}
                        className="w-full h-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-sm mt-1"
                      >
                        <option value="">Select Center</option>
                        {centers.map((center) => (
                          <option key={center.id} value={center.id}>
                            {center.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3 mt-6">
                    <Button
                      onClick={editingId ? handleUpdate : handleAdd}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {editingId ? 'Update' : 'Add User'}
                    </Button>
                    <Button
                      onClick={handleClear}
                      variant="outline"
                      className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400"
                    >
                      Clear
                    </Button>
                    {editingId && (
                      <Button
                        onClick={() => handleDelete(editingId)}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Users List</h3>
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-white w-48 lg:w-64 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  
                  {getFilteredData().length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No users found
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                            <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                            <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Center</th>
                            <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers().map((user: User) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="border border-gray-200 px-4 py-3 text-sm">{user.fullName}</td>
                              <td className="border border-gray-200 px-4 py-3 text-sm">{user.username}</td>
                              <td className="border border-gray-200 px-4 py-3 text-sm">{user.mobileNumber}</td>
                              <td className="border border-gray-200 px-4 py-3 text-sm">{roles.find(r => r.id === user.roleId)?.name || ''}</td>
                              <td className="border border-gray-200 px-4 py-3 text-sm">{centers.find(c => c.id === user.centerId)?.name || ''}</td>
                              <td className="border border-gray-200 px-4 py-3 text-sm">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.status}
                                </span>
                              </td>
                              <td className="border border-gray-200 px-4 py-3 text-sm">
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(user)}
                                    className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400"
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(user.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ROLES & PERMISSIONS TAB */}
            {activeTab === 'roles' && (
              <div className="space-y-6">
                {/* Role Form */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {editingId ? 'Edit Role' : 'Add New Role'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label htmlFor="roleName" className="text-sm font-medium text-gray-700">Role Name</Label>
                      <Input
                        id="roleName"
                        value={roleForm.name || ''}
                        onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                        placeholder="Enter role name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="roleDescription" className="text-sm font-medium text-gray-700">Description</Label>
                      <Input
                        id="roleDescription"
                        value={roleForm.description || ''}
                        onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                        placeholder="Enter role description"
                      />
                    </div>
                  </div>

                  {/* Permissions Matrix */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Permissions</h4>
                    
                    {/* Transactions Module */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-800 mb-3">Transactions</h5>
                      <div className="grid grid-cols-4 gap-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions?.transactions?.view || false}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                transactions: {
                                  ...roleForm.permissions?.transactions!,
                                  view: e.target.checked
                                }
                              }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">View</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions?.transactions?.add || false}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                transactions: {
                                  ...roleForm.permissions?.transactions!,
                                  add: e.target.checked
                                }
                              }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">Add</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions?.transactions?.edit || false}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                transactions: {
                                  ...roleForm.permissions?.transactions!,
                                  edit: e.target.checked
                                }
                              }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">Edit</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions?.transactions?.delete || false}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                transactions: {
                                  ...roleForm.permissions?.transactions!,
                                  delete: e.target.checked
                                }
                              }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">Delete</span>
                        </label>
                      </div>
                    </div>

                    {/* Reports Module */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-800 mb-3">Reports</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions?.reports?.view || false}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                reports: {
                                  ...roleForm.permissions?.reports!,
                                  view: e.target.checked
                                }
                              }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">View</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions?.reports?.export || false}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                reports: {
                                  ...roleForm.permissions?.reports!,
                                  export: e.target.checked
                                }
                              }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">Export</span>
                        </label>
                      </div>
                    </div>

                    {/* Balance Sheet Module */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-800 mb-3">Balance Sheet</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions?.balanceSheet?.view || false}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                balanceSheet: {
                                  ...roleForm.permissions?.balanceSheet!,
                                  view: e.target.checked
                                }
                              }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">View</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions?.balanceSheet?.export || false}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                balanceSheet: {
                                  ...roleForm.permissions?.balanceSheet!,
                                  export: e.target.checked
                                }
                              }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">Export</span>
                        </label>
                      </div>
                    </div>

                    {/* Master Module */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-800 mb-3">Master</h5>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={roleForm.permissions?.master?.fullAccess || false}
                          onChange={(e) => setRoleForm({
                            ...roleForm,
                            permissions: {
                              ...roleForm.permissions!,
                              master: {
                                fullAccess: e.target.checked
                              }
                            }
                          })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">Full Access</span>
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3 mt-6">
                    <Button
                      onClick={editingId ? handleUpdate : handleAdd}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {editingId ? 'Update Role' : 'Add Role'}
                    </Button>
                    <Button
                      onClick={handleClear}
                      variant="outline"
                      className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400"
                    >
                      Clear
                    </Button>
                    {editingId && (
                      <Button
                        onClick={() => handleDelete(editingId)}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                {/* Roles Table */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Roles List</h3>
                  
                  {filteredRoles().length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No roles found
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredRoles().map((role: Role) => (
                        <div key={role.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{role.name}</h4>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(role)}
                                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400"
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(role.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                          <div className="text-xs text-gray-500">
                            <div className="font-medium mb-1">Permissions:</div>
                            <div className="space-y-1">
                              <div>• Transactions: {Object.values(role.permissions.transactions).filter(Boolean).length}/4</div>
                              <div>• Reports: {Object.values(role.permissions.reports).filter(Boolean).length}/2</div>
                              <div>• Balance Sheet: {Object.values(role.permissions.balanceSheet).filter(Boolean).length}/2</div>
                              <div>• Master: {role.permissions.master.fullAccess ? 'Full Access' : 'Limited'}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CENTERS TAB */}
            {activeTab === 'centers' && (
              <div className="space-y-6">
                {/* Center Form */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {editingId ? 'Edit Center' : 'Add New Center'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="centerName" className="text-sm font-medium text-gray-700">Center Name</Label>
                      <Input
                        id="centerName"
                        value={centerForm.name || ''}
                        onChange={(e) => setCenterForm({ ...centerForm, name: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1 text-gray-900 placeholder-gray-500"
                        placeholder="Enter center name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="centerCode" className="text-sm font-medium text-gray-700">Center Code</Label>
                      <Input
                        id="centerCode"
                        value={centerForm.code || ''}
                        onChange={(e) => setCenterForm({ ...centerForm, code: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1 text-gray-900 placeholder-gray-500"
                        placeholder="Enter center code"
                      />
                    </div>
                    <div>
                      <Label htmlFor="centerCity" className="text-sm font-medium text-gray-700">State</Label>
                      <Input
                        id="centerCity"
                        value={centerForm.city || ''}
                        onChange={(e) => setCenterForm({ ...centerForm, city: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1 text-gray-900 placeholder-gray-500"
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="centerAddress" className="text-sm font-medium text-gray-700">Address</Label>
                      <Input
                        id="centerAddress"
                        value={centerForm.address || ''}
                        onChange={(e) => setCenterForm({ ...centerForm, address: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1 text-gray-900 placeholder-gray-500"
                        placeholder="Enter address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="centerContact" className="text-sm font-medium text-gray-700">Contact Number</Label>
                      <Input
                        id="centerContact"
                        value={centerForm.contactNumber || ''}
                        onChange={(e) => setCenterForm({ ...centerForm, contactNumber: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1 text-gray-900 placeholder-gray-500"
                        placeholder="Enter contact number"
                      />
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3 mt-6">
                    <Button
                      onClick={editingId ? handleUpdate : handleAdd}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {editingId ? 'Update Center' : 'Add Center'}
                    </Button>
                    <Button
                      onClick={handleClear}
                      variant="outline"
                      className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400"
                    >
                      Clear
                    </Button>
                    {editingId && (
                      <Button
                        onClick={() => handleDelete(editingId)}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                {/* Centers Table */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Centers List</h3>
                    <Input
                      placeholder="Search centers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-white w-48 lg:w-64 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  
                  {centersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading centers...</span>
                    </div>
                  ) : filteredCenters().length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No centers found
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Name
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Code
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                              City
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                              Address
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden md:table-cell">
                              Contact
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {filteredCenters().map((center: Center) => (
                            <tr key={center.id} className="hover:bg-blue-50 transition-colors">
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {center.name}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                                {center.code}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                                {center.city}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
                                {center.address}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                                {center.contactNumber}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-4 font-medium rounded-full ${
                                  center.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {center.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm">
                                {isAdmin && (
                                  <div className="flex space-x-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEdit(center)}
                                      className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400 h-7 px-2 text-xs"
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDelete(center.id)}
                                      className="bg-red-500 hover:bg-red-600 text-white h-7 px-2 text-xs"
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CLIENTS TAB */}
            {activeTab === 'clients' && (
              <div className="space-y-6">
                {/* Client Form */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {editingId ? 'Edit Client' : 'Add New Client'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clientName" className="text-sm font-medium text-gray-700">Client Name</Label>
                      <Input
                        id="clientName"
                        value={clientForm.name || ''}
                        onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1 text-gray-900"
                        placeholder="Enter client name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientMobile" className="text-sm font-medium text-gray-700">Mobile Number</Label>
                      <Input
                        id="clientMobile"
                        value={clientForm.mobileNumber || ''}
                        onChange={(e) => setClientForm({ ...clientForm, mobileNumber: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1 text-gray-900"
                        placeholder="Enter mobile number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientCity" className="text-sm font-medium text-gray-700">City</Label>
                      <Input
                        id="clientCity"
                        value={clientForm.city || ''}
                        onChange={(e) => setClientForm({ ...clientForm, city: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1 text-gray-900"
                        placeholder="Enter city"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="clientNotes" className="text-sm font-medium text-gray-700">Notes (Optional)</Label>
                      <textarea
                        id="clientNotes"
                        value={clientForm.notes || ''}
                        onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                        className="w-full bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1 text-gray-900"
                        rows={3}
                        placeholder="Enter notes"
                      />
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3 mt-6">
                    <Button
                      onClick={editingId ? handleUpdate : handleAdd}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {editingId ? 'Update Client' : 'Add Client'}
                    </Button>
                    <Button
                      onClick={handleClear}
                      variant="outline"
                      className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400"
                    >
                      Clear
                    </Button>
                    {editingId && (
                      <Button
                        onClick={() => handleDelete(editingId)}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                {/* Clients Table */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Clients List</h3>
                    <Input
                      placeholder="Search clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-white w-48 lg:w-64 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  
                  {filteredClients().length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No clients found
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Name
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Mobile
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                              City
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                              Notes
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {filteredClients().map((client: Client) => (
                            <tr key={client.id} className="hover:bg-blue-50 transition-colors">
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {client.name}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                                {client.mobileNumber}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                                {client.city}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
                                {client.notes || '-'}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm">
                                {isAdmin && (
                                  <div className="flex space-x-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEdit(client)}
                                      className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400 h-7 px-2 text-xs"
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDelete(client.id)}
                                      className="bg-red-500 hover:bg-red-600 text-white h-7 px-2 text-xs"
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
