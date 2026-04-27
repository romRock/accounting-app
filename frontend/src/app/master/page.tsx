'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store';
import { formatDate } from '@/lib/utils';

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
  alternateNumber?: string;
  address: string;
  city: string;
  type: 'Sender' | 'Receiver' | 'Both';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

    // Mock centers
    const mockCenters: Center[] = [
      {
        id: '1',
        name: 'Main Branch',
        code: 'BR001',
        city: 'Mumbai',
        address: '123, Main Street, Mumbai - 400001',
        contactNumber: '+91-22-12345678',
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Branch Office',
        code: 'BR002',
        city: 'Delhi',
        address: '456, Park Avenue, Delhi - 110001',
        contactNumber: '+91-11-87654321',
        status: 'Active',
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

    // Mock clients
    const mockClients: Client[] = [
      {
        id: '1',
        name: 'ABC Corporation',
        mobileNumber: '+91-9876543212',
        alternateNumber: '+91-9876543213',
        address: '789, Business Park, Bangalore',
        city: 'Bangalore',
        type: 'Both',
        notes: 'Regular corporate client',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'XYZ Traders',
        mobileNumber: '+91-9876543214',
        address: '321, Market Area, Chennai',
        city: 'Chennai',
        type: 'Sender',
        notes: 'Individual trader',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    setRoles(mockRoles);
    setCenters(mockCenters);
    setUsers(mockUsers);
    setClients(mockClients);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    generateMockData();
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
        if (centerForm.name && centerForm.code && centerForm.city && centerForm.contactNumber) {
          const newCenter: Center = {
            ...centerForm as Center,
            id: Date.now().toString(),
            status: 'Active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setCenters([...centers, newCenter]);
          setCenterForm({});
        }
        break;
      case 'clients':
        if (clientForm.name && clientForm.mobileNumber && clientForm.address && clientForm.city) {
          const newClient: Client = {
            ...clientForm as Client,
            id: Date.now().toString(),
            type: clientForm.type || 'Both',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setClients([...clients, newClient]);
          setClientForm({});
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
          setCenters(centers.filter(c => c.id !== id));
          break;
        case 'clients':
          setClients(clients.filter(c => c.id !== id));
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
        setCenters(centers.map(c => c.id === editingId ? { ...centerForm as Center, id: editingId } : c));
        break;
      case 'clients':
        setClients(clients.map(c => c.id === editingId ? { ...clientForm as Client, id: editingId } : c));
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
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                        placeholder="Enter center name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="centerCode" className="text-sm font-medium text-gray-700">Center Code</Label>
                      <Input
                        id="centerCode"
                        value={centerForm.code || ''}
                        onChange={(e) => setCenterForm({ ...centerForm, code: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                        placeholder="Enter center code"
                      />
                    </div>
                    <div>
                      <Label htmlFor="centerCity" className="text-sm font-medium text-gray-700">City</Label>
                      <Input
                        id="centerCity"
                        value={centerForm.city || ''}
                        onChange={(e) => setCenterForm({ ...centerForm, city: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="centerAddress" className="text-sm font-medium text-gray-700">Address</Label>
                      <Input
                        id="centerAddress"
                        value={centerForm.address || ''}
                        onChange={(e) => setCenterForm({ ...centerForm, address: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                        placeholder="Enter address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="centerContact" className="text-sm font-medium text-gray-700">Contact Number</Label>
                      <Input
                        id="centerContact"
                        value={centerForm.contactNumber || ''}
                        onChange={(e) => setCenterForm({ ...centerForm, contactNumber: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
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
                      className="bg-white w-48 lg:w-64 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  
                  {filteredCenters().length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No centers found
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredCenters().map((center: Center) => (
                        <div key={center.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{center.name}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              center.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {center.status}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div><span className="font-medium">Code:</span> {center.code}</div>
                            <div><span className="font-medium">City:</span> {center.city}</div>
                            <div><span className="font-medium">Address:</span> {center.address}</div>
                            <div><span className="font-medium">Contact:</span> {center.contactNumber}</div>
                          </div>
                          <div className="flex space-x-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(center)}
                              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(center.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="clientName" className="text-sm font-medium text-gray-700">Client Name</Label>
                      <Input
                        id="clientName"
                        value={clientForm.name || ''}
                        onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                        placeholder="Enter client name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientMobile" className="text-sm font-medium text-gray-700">Mobile Number</Label>
                      <Input
                        id="clientMobile"
                        value={clientForm.mobileNumber || ''}
                        onChange={(e) => setClientForm({ ...clientForm, mobileNumber: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                        placeholder="Enter mobile number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientAlternate" className="text-sm font-medium text-gray-700">Alternate Number (Optional)</Label>
                      <Input
                        id="clientAlternate"
                        value={clientForm.alternateNumber || ''}
                        onChange={(e) => setClientForm({ ...clientForm, alternateNumber: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                        placeholder="Enter alternate number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientAddress" className="text-sm font-medium text-gray-700">Address</Label>
                      <Input
                        id="clientAddress"
                        value={clientForm.address || ''}
                        onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                        placeholder="Enter address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientCity" className="text-sm font-medium text-gray-700">City</Label>
                      <Input
                        id="clientCity"
                        value={clientForm.city || ''}
                        onChange={(e) => setClientForm({ ...clientForm, city: e.target.value })}
                        className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientType" className="text-sm font-medium text-gray-700">Type</Label>
                      <select
                        id="clientType"
                        value={clientForm.type || ''}
                        onChange={(e) => setClientForm({ ...clientForm, type: e.target.value as any })}
                        className="w-full h-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-sm mt-1"
                      >
                        <option value="">Select Type</option>
                        <option value="Sender">Sender</option>
                        <option value="Receiver">Receiver</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>
                    <div className="lg:col-span-3">
                      <Label htmlFor="clientNotes" className="text-sm font-medium text-gray-700">Notes (Optional)</Label>
                      <textarea
                        id="clientNotes"
                        value={clientForm.notes || ''}
                        onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                        className="w-full bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
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
                      className="bg-white w-48 lg:w-64 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  
                  {filteredClients().length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No clients found
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredClients().map((client: Client) => (
                        <div key={client.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{client.name}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              client.type === 'Sender' ? 'bg-blue-100 text-blue-800' :
                              client.type === 'Receiver' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {client.type}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div><span className="font-medium">Mobile:</span> {client.mobileNumber}</div>
                            {client.alternateNumber && (
                              <div><span className="font-medium">Alternate:</span> {client.alternateNumber}</div>
                            )}
                            <div><span className="font-medium">City:</span> {client.city}</div>
                            <div><span className="font-medium">Address:</span> {client.address}</div>
                            {client.notes && (
                              <div><span className="font-medium">Notes:</span> {client.notes}</div>
                            )}
                          </div>
                          <div className="flex space-x-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(client)}
                              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(client.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
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
