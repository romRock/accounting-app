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
  permissions: {
    dashboard: { view: boolean };
    transactions: { outward: boolean; inward: boolean };
    accounting: 'all' | 'none';
    hawala: 'all' | 'none';
    specialEntry: 'all' | 'none';
    reports: {
      report_1: boolean;
      report_2: boolean;
      report_3: boolean;
      report_4: boolean;
      report_5: boolean;
      report_6: boolean;
      report_7: boolean;
    };
    balanceSheet: 'all' | 'none';
    masterData: 'full_access' | 'role_based_access' | 'none';
  };
  createdAt: string;
  updatedAt: string;
  userCount?: number;
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
  const [roleForm, setRoleForm] = useState<Partial<Role>>({
    permissions: {
      dashboard: { view: false },
      transactions: { outward: false, inward: false },
      accounting: 'none',
      hawala: 'none',
      specialEntry: 'none',
      reports: {
        report_1: false,
        report_2: false,
        report_3: false,
        report_4: false,
        report_5: false,
        report_6: false,
        report_7: false
      },
      balanceSheet: 'none',
      masterData: 'none'
    }
  });
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

  // Check if user is admin or super admin based on permissions only
  const isAdmin = () => {
    if (!user?.role?.permissions) return false;

    // Parse permissions from JSON string if needed
    let permissions;
    try {
      permissions = typeof user.role.permissions === 'string' 
        ? JSON.parse(user.role.permissions) 
        : user.role.permissions;
    } catch (error) {
      console.error('Error parsing permissions:', error);
      return false;
    }

    // Strict RBAC - only allow if user has explicit full_access permission
    // Works like other single access modules - no access by default
    return permissions.masterData === 'full_access' ||
           permissions.master?.read ||
           permissions.master?.write;
  };

  // Redirect non-admin users
  useEffect(() => {
    if (user && !isAdmin()) {
      // Redirect to first allowed page
      const pagePriority = [
        { path: '/transactions', check: () => {
          const permissions = typeof user.role.permissions === 'string' 
            ? JSON.parse(user.role.permissions) 
            : user.role.permissions;
          return permissions.transactions?.outward || permissions.transactions?.inward || permissions.transactions?.read;
        }},
        { path: '/reports', check: () => {
          const permissions = typeof user.role.permissions === 'string' 
            ? JSON.parse(user.role.permissions) 
            : user.role.permissions;
          return permissions.reports?.read || Object.values(permissions.reports || {}).some(Boolean);
        }},
        { path: '/accounting', check: () => {
          const permissions = typeof user.role.permissions === 'string' 
            ? JSON.parse(user.role.permissions) 
            : user.role.permissions;
          return permissions.accounting === 'all' || permissions.accounting?.read;
        }},
        { path: '/help', check: () => true } // Help is always accessible
      ];

      for (const page of pagePriority) {
        if (page.check()) {
          router.push(page.path);
          return;
        }
      }

      // If no permissions found, redirect to help
      router.push('/help');
    }
  }, [user, router]);

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

  // Load real roles data
  const loadRoles = async () => {
    try {
      console.log("=== MASTER PAGE: Loading roles ===");
      
      const rolesData = await transactionApi.getRoles();
      console.log("API returned roles:", rolesData.length, rolesData);
      
      setRoles(rolesData);
    } catch (error) {
      console.error("Error loading roles:", error);
      setRoles([]); // Set empty array on error
    }
  };

  // Load real users data
  const loadUsers = async () => {
    try {
      console.log("=== MASTER PAGE: Loading users ===");
      
      const usersData = await transactionApi.getUsers();
      console.log("API returned users:", usersData.length, usersData);
      
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]); // Set empty array on error
    }
  };

  // Generate mock data
  const generateMockData = () => {
    // Mock roles
    const mockRoles: Role[] = [
      {
        id: '1',
        name: 'Super Admin',
        permissions: {
          dashboard: { view: true },
          transactions: { outward: true, inward: true },
          accounting: 'all',
          hawala: 'all',
          specialEntry: 'all',
          reports: {
            report_1: true,
            report_2: true,
            report_3: true,
            report_4: true,
            report_5: true,
            report_6: true,
            report_7: true
          },
          balanceSheet: 'all',
          masterData: 'full_access'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userCount: 0
      },
      {
        id: '2',
        name: 'Admin',
        permissions: {
          dashboard: { view: true },
          transactions: { outward: true, inward: true },
          accounting: 'all',
          hawala: 'all',
          specialEntry: 'all',
          reports: {
            report_1: true,
            report_2: true,
            report_3: true,
            report_4: true,
            report_5: true,
            report_6: false,
            report_7: false
          },
          balanceSheet: 'all',
          masterData: 'role_based_access'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userCount: 0
      },
      {
        id: '3',
        name: 'Operator',
        permissions: {
          dashboard: { view: true },
          transactions: { outward: false, inward: true },
          accounting: 'none',
          hawala: 'none',
          specialEntry: 'none',
          reports: {
            report_1: false,
            report_2: true,
            report_3: false,
            report_4: false,
            report_5: false,
            report_6: false,
            report_7: false
          },
          balanceSheet: 'none',
          masterData: 'role_based_access'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userCount: 0
      },
      {
        id: '4',
        name: 'Viewer',
        permissions: {
          dashboard: { view: true },
          transactions: { outward: false, inward: false },
          accounting: 'none',
          hawala: 'none',
          specialEntry: 'none',
          reports: {
            report_1: false,
            report_2: false,
            report_3: false,
            report_4: false,
            report_5: false,
            report_6: false,
            report_7: false
          },
          balanceSheet: 'none',
          masterData: 'role_based_access'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userCount: 0
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
    loadRoles(); // Load real roles data
    loadUsers(); // Load real users data
  }, [isAuthenticated, router]);

  // Listen for tab changes from header
  useEffect(() => {
    const handleTabChange = (e: CustomEvent) => {
      const newTab = e.detail;
      setActiveTab(newTab);
      
      // Load data when switching to specific tabs
      if (newTab === 'roles') {
        loadRoles();
      } else if (newTab === 'centers') {
        loadCenters();
      } else if (newTab === 'clients') {
        loadClients();
      }
    };

    window.addEventListener('setMasterTab', handleTabChange as EventListener);
    return () => window.removeEventListener('setMasterTab', handleTabChange as EventListener);
  }, []);

  // CRUD operations
  const handleAdd = () => {
    switch (activeTab) {
      case 'users':
        if (userForm.fullName && userForm.mobileNumber && userForm.password && userForm.roleId) {
          // Make API call to add user
          transactionApi.addUser(
            userForm.fullName,
            userForm.mobileNumber,
            userForm.email || '',
            userForm.password,
            userForm.roleId
          )
          .then((response) => {
            if (response.success) {
              // Reload users list
              loadUsers();
              setUserForm({});
              alert('User added successfully');
            } else {
              alert('Failed to add user: ' + response.message);
            }
          })
          .catch((error) => {
            console.error('Error adding user:', error);
            alert('Failed to add user: ' + error.message);
          });
        }
        break;
      case 'roles':
        if (roleForm.name) {
          // Only admins can add roles
          if (!isAdmin) {
            alert('Only administrators can add new roles');
            return;
          }

          const addNewRole = async () => {
            try {
              setLoading(true);
              const newRole = await transactionApi.addRole(
                roleForm.name!,
                roleForm.permissions || {
                  dashboard: { view: false },
                  transactions: { outward: false, inward: false },
                  accounting: "none" as const,
                  hawala: "none" as const,
                  specialEntry: "none" as const,
                  reports: { 
                    report_1: false, 
                    report_2: false, 
                    report_3: false, 
                    report_4: false, 
                    report_5: false, 
                    report_6: false, 
                    report_7: false 
                  },
                  balanceSheet: "none" as const,
                  masterData: "role_based_access" as const
                }
              );

              // Convert to Role format and add to local state
              const roleData: Role = {
                id: newRole.id,
                name: newRole.name,
                permissions: newRole.permissions,
                createdAt: newRole.createdAt,
                updatedAt: newRole.updatedAt
              };

              setRoles([...roles, roleData]);
              setRoleForm({});
              alert('Role added successfully!');
            } catch (error) {
              console.error('Error adding role:', error);
              alert(error instanceof Error ? error.message : 'Failed to add role');
            } finally {
              setLoading(false);
            }
          };

          addNewRole();
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
        setRoleForm({
          ...item,
          permissions: typeof item.permissions === 'string' 
            ? JSON.parse(item.permissions) 
            : item.permissions
        });
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
          // Make API call to delete user
          transactionApi.deleteUser(id)
          .then(() => {
            // Reload users list
            loadUsers();
            alert('User deleted successfully');
          })
          .catch((error) => {
            console.error('Error deleting user:', error);
            alert('Failed to delete user: ' + error.message);
          });
          break;
        case 'roles':
          // Only admins can delete roles
          if (!isAdmin) {
            alert('Only administrators can delete roles');
            return;
          }

          const deleteRole = async () => {
            try {
              setLoading(true);
              await transactionApi.deleteRole(id);
              setRoles(roles.filter(r => r.id !== id));
              alert('Role deleted successfully!');
            } catch (error) {
              console.error('Error deleting role:', error);
              alert(error instanceof Error ? error.message : 'Failed to delete role');
            } finally {
              setLoading(false);
            }
          };

          deleteRole();
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
        // Make API call to update user
        transactionApi.updateUser(
          editingId!,
          userForm.fullName!,
          userForm.mobileNumber!,
          userForm.email || '',
          userForm.password || '',
          userForm.roleId!
        )
        .then((response) => {
          if (response.success) {
            // Reload users list
            loadUsers();
            setUserForm({});
            setEditingId(null);
            alert('User updated successfully');
          } else {
            alert('Failed to update user: ' + response.message);
          }
        })
        .catch((error) => {
          console.error('Error updating user:', error);
          alert('Failed to update user: ' + error.message);
        });
        break;
      case 'roles':
        // Only admins can update roles
        if (!isAdmin) {
          alert('Only administrators can update roles');
          return;
        }

        const updateRole = async () => {
          try {
            setLoading(true);
            const updatedRole = await transactionApi.updateRole(
              editingId!,
              roleForm.name!,
              roleForm.permissions!
            );

            // Convert to Role format and update local state
            const roleData: Role = {
              id: updatedRole.id,
              name: updatedRole.name,
              permissions: updatedRole.permissions,
              createdAt: updatedRole.createdAt,
              updatedAt: updatedRole.updatedAt
            };

            setRoles(roles.map(r => r.id === editingId ? roleData : r));
            setRoleForm({});
            setEditingId(null);
            alert('Role updated successfully!');
          } catch (error) {
            console.error('Error updating role:', error);
            alert(error instanceof Error ? error.message : 'Failed to update role');
          } finally {
            setLoading(false);
          }
        };

        updateRole();
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
    setRoleForm({
      permissions: {
        dashboard: { view: false },
        transactions: { outward: false, inward: false },
        accounting: 'none',
        hawala: 'none',
        specialEntry: 'none',
        reports: {
          report_1: false,
          report_2: false,
          report_3: false,
          report_4: false,
          report_5: false,
          report_6: false,
          report_7: false
        },
        balanceSheet: 'none',
        masterData: 'role_based_access'
      }
    });
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
    r.name && r.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1 text-gray-900 placeholder-gray-500"
                        placeholder="Enter full name"
                      />
                    </div>
                                        <div>
                      <Label htmlFor="mobileNumber" className="text-sm font-medium text-gray-700">Mobile Number</Label>
                      <Input
                        id="mobileNumber"
                        value={userForm.mobileNumber || ''}
                        onChange={(e) => setUserForm({ ...userForm, mobileNumber: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1 text-gray-900 placeholder-gray-500"
                        placeholder="Enter mobile number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email (Optional)</Label>
                      <Input
                        id="email"
                        value={userForm.email || ''}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1 text-gray-900 placeholder-gray-500"
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
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1 text-gray-900 placeholder-gray-500"
                        placeholder="Enter password"
                      />
                    </div>
                                        <div>
                      <Label htmlFor="roleId" className="text-sm font-medium text-gray-700">Role</Label>
                      <select
                        id="roleId"
                        value={userForm.roleId || ''}
                        onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
                        className="w-full h-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-sm mt-1 text-gray-900"
                      >
                        <option value="">Select Role</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
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
                      className="bg-white w-48 lg:w-64 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder-gray-500"
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
                            <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                            <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers().map((user: any) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">{user.fullName}</td>
                              <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">{user.mobileNumber}</td>
                              <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">{user.email || ''}</td>
                              <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">{roles.find(r => r.id === user.roleId)?.name || ''}</td>
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
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1 text-gray-900 placeholder-gray-500"
                        placeholder="Enter role name"
                      />
                    </div>
                    <div>
                      {/* Description field removed as requested */}
                    </div>
                  </div>

                  {/* RBAC Permissions Matrix */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">RBAC Permissions</h4>
                    
                    {/* Dashboard Module */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">Dashboard</h5>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={roleForm.permissions?.dashboard?.view || false}
                          onChange={(e) => setRoleForm({
                            ...roleForm,
                            permissions: {
                              ...roleForm.permissions!,
                              dashboard: {
                                view: e.target.checked
                              }
                            }
                          })}
                          className="h-4 w-4 rounded border-gray-300 bg-blue-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
                        />
                        <span className="text-sm text-gray-900">View Dashboard</span>
                      </label>
                    </div>

                    {/* Transactions Module */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">Transactions</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions?.transactions?.outward || false}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                transactions: {
                                  ...roleForm.permissions?.transactions!,
                                  outward: e.target.checked
                                }
                              }
                            })}
                            className="h-4 w-4 rounded border-gray-300 bg-blue-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
                          />
                          <span className="text-sm text-gray-900">Outward</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions?.transactions?.inward || false}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                transactions: {
                                  ...roleForm.permissions?.transactions!,
                                  inward: e.target.checked
                                }
                              }
                            })}
                            className="h-4 w-4 rounded border-gray-300 bg-blue-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
                          />
                          <span className="text-sm text-gray-900">Inward</span>
                        </label>
                      </div>
                    </div>

                    {/* Accounting Module */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">Accounting</h5>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="accounting"
                            checked={roleForm.permissions?.accounting === 'all'}
                            onChange={() => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                accounting: 'all'
                              }
                            })}
                            className="h-4 w-4 rounded border-gray-300 bg-blue-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
                          />
                          <span className="text-sm text-gray-900">All Access</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="accounting"
                            checked={roleForm.permissions?.accounting === 'none'}
                            onChange={() => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                accounting: 'none'
                              }
                            })}
                            className="h-4 w-4 rounded border-gray-300 bg-blue-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
                          />
                          <span className="text-sm text-gray-900">No Access</span>
                        </label>
                      </div>
                    </div>

                    {/* Hawala Module */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">Hawala</h5>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="hawala"
                            checked={roleForm.permissions?.hawala === 'all'}
                            onChange={() => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                hawala: 'all'
                              }
                            })}
                            className="h-4 w-4 rounded border-gray-300 bg-blue-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
                          />
                          <span className="text-sm text-gray-900">All Access</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="hawala"
                            checked={roleForm.permissions?.hawala === 'none'}
                            onChange={() => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                hawala: 'none'
                              }
                            })}
                            className="h-4 w-4 rounded border-gray-300 bg-blue-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
                          />
                          <span className="text-sm text-gray-900">No Access</span>
                        </label>
                      </div>
                    </div>

                    {/* Special Entry Module */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">Special Entry</h5>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="specialEntry"
                            checked={roleForm.permissions?.specialEntry === 'all'}
                            onChange={() => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                specialEntry: 'all'
                              }
                            })}
                            className="h-4 w-4 rounded border-gray-300 bg-blue-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
                          />
                          <span className="text-sm text-gray-900">All Access</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="specialEntry"
                            checked={roleForm.permissions?.specialEntry === 'none'}
                            onChange={() => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                specialEntry: 'none'
                              }
                            })}
                            className="h-4 w-4 rounded border-gray-300 bg-blue-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
                          />
                          <span className="text-sm text-gray-900">No Access</span>
                        </label>
                      </div>
                    </div>

                    {/* Reports Module */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">Reports</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions?.reports?.report_1 || false}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                reports: {
                                  ...roleForm.permissions?.reports!,
                                  report_1: e.target.checked
                                }
                              }
                            })}
                            className="h-4 w-4 rounded border-gray-300 bg-blue-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
                          />
                          <span className="text-sm text-gray-900">Outward Report</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions?.reports?.report_2 || false}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                reports: {
                                  ...roleForm.permissions?.reports!,
                                  report_2: e.target.checked
                                }
                              }
                            })}
                            className="h-4 w-4 rounded border-gray-300 bg-blue-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
                          />
                          <span className="text-sm text-gray-900">Inward Report</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions?.reports?.report_3 || false}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                reports: {
                                  ...roleForm.permissions?.reports!,
                                  report_3: e.target.checked
                                }
                              }
                            })}
                            className="h-4 w-4 rounded border-gray-300 bg-blue-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
                          />
                          <span className="text-sm text-gray-900">Combo Report</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions?.reports?.report_4 || false}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                reports: {
                                  ...roleForm.permissions?.reports!,
                                  report_4: e.target.checked
                                }
                              }
                            })}
                            className="h-4 w-4 rounded border-gray-300 bg-blue-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
                          />
                          <span className="text-sm text-gray-900">Outward Centerwise Report</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions?.reports?.report_5 || false}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                reports: {
                                  ...roleForm.permissions?.reports!,
                                  report_5: e.target.checked
                                }
                              }
                            })}
                            className="h-4 w-4 rounded border-gray-300 bg-blue-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
                          />
                          <span className="text-sm text-gray-900">Inward Centerwise Report</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions?.reports?.report_6 || false}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                reports: {
                                  ...roleForm.permissions?.reports!,
                                  report_6: e.target.checked
                                }
                              }
                            })}
                            className="h-4 w-4 rounded border-gray-300 bg-blue-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
                          />
                          <span className="text-sm text-gray-900">Amount Type Report</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions?.reports?.report_7 || false}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                reports: {
                                  ...roleForm.permissions?.reports!,
                                  report_7: e.target.checked
                                }
                              }
                            })}
                            className="h-4 w-4 rounded border-gray-300 bg-blue-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
                          />
                          <span className="text-sm text-gray-900">Customer Transaction Report</span>
                        </label>
                      </div>
                    </div>

                    {/* Balance Sheet Module */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">Balance Sheet</h5>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="balanceSheet"
                            checked={roleForm.permissions?.balanceSheet === 'all'}
                            onChange={() => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                balanceSheet: 'all'
                              }
                            })}
                            className="h-4 w-4 rounded border-gray-300 bg-blue-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
                          />
                          <span className="text-sm text-gray-900">All Access</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="balanceSheet"
                            checked={roleForm.permissions?.balanceSheet === 'none'}
                            onChange={() => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                balanceSheet: 'none'
                              }
                            })}
                            className="h-4 w-4 rounded border-gray-300 bg-blue-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
                          />
                          <span className="text-sm text-gray-900">No Access</span>
                        </label>
                      </div>
                    </div>

                    {/* Master Data Module */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">Master Data</h5>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="masterData"
                            checked={roleForm.permissions?.masterData === 'full_access'}
                            onChange={() => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                masterData: 'full_access'
                              }
                            })}
                            className="h-4 w-4 rounded border-gray-300 bg-blue-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
                          />
                          <span className="text-sm text-gray-900">All Access</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="masterData"
                            checked={roleForm.permissions?.masterData === 'none'}
                            onChange={() => setRoleForm({
                              ...roleForm,
                              permissions: {
                                ...roleForm.permissions!,
                                masterData: 'none'
                              }
                            })}
                            className="h-4 w-4 rounded border-gray-300 bg-blue-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
                          />
                          <span className="text-sm text-gray-900">No Access</span>
                        </label>
                      </div>
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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Roles List</h3>
                    <Input
                      placeholder="Search roles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-white w-48 lg:w-64 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  
                  {filteredRoles().length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No roles found
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Role Name</th>
                            <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRoles().map((role: Role) => (
                            <tr key={role.id} className="hover:bg-gray-50">
                              <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">{role.name}</td>
                              <td className="border border-gray-200 px-4 py-3 text-sm">
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
                                {isAdmin() && (
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
                                {isAdmin() && (
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
