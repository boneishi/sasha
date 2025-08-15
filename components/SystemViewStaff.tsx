import React, { useState, useEffect } from 'react';
import type { Staff, Team, Permission, Role } from '../types';
import { Modal } from './Modal';
import { ALL_PERMISSIONS } from '../constants';
import { Input, Select, Button } from './common';
import { PencilIcon, TrashIcon } from './icons';
import { SectionHeader } from './SystemViewCommon';

const StaffModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (staff: Staff) => void;
    staffMember: Staff | null;
    teams: Team[];
    roles: Role[];
}> = ({ isOpen, onClose, onSave, staffMember, teams, roles }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [teamId, setTeamId] = useState('');
    const [roleId, setRoleId] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(staffMember?.name || '');
            setEmail(staffMember?.email || '');
            setMobile(staffMember?.mobile || '');
            setTeamId(staffMember?.teamId || (teams.length > 0 ? teams[0].id : ''));
            setRoleId(staffMember?.roleId || (roles.length > 0 ? roles[0].id : ''));
        }
    }, [isOpen, staffMember, teams, roles]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !teamId || !roleId || !email) {
            alert('Please provide a name, email, select a team, and select a role.');
            return;
        }

        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
        onSave({
            id: staffMember?.id || `staff-${Date.now()}`,
            name,
            initials,
            teamId,
            roleId,
            email,
            mobile,
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={staffMember ? 'Edit Staff Member' : 'Add New Staff Member'} size="xl">
            <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="staff-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <Input
                            id="staff-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="staff-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                        <Input
                            id="staff-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="staff-mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Phone</label>
                        <Input
                            id="staff-mobile"
                            type="tel"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="staff-team" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Team</label>
                        <Select
                            id="staff-team"
                            value={teamId}
                            onChange={(e) => setTeamId(e.target.value)}
                        >
                             {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </Select>
                    </div>
                     <div>
                        <label htmlFor="staff-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                        <Select
                            id="staff-role"
                            value={roleId}
                            onChange={(e) => setRoleId(e.target.value)}
                        >
                             {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Staff Member</Button>
                </div>
            </form>
        </Modal>
    );
};

const RoleModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (role: Role) => void;
    role: Role | null;
}> = ({ isOpen, onClose, onSave, role }) => {
    const [name, setName] = useState('');
    const [permissions, setPermissions] = useState<Permission[]>([]);

    useEffect(() => {
        if (isOpen) {
            setName(role?.name || '');
            setPermissions(role?.permissions || []);
        }
    }, [isOpen, role]);

    const handlePermissionChange = (permission: Permission) => {
        setPermissions(prev =>
            prev.includes(permission)
                ? prev.filter(p => p !== permission)
                : [...prev, permission]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            alert('Please provide a name for the role.');
            return;
        }
        onSave({
            id: role?.id || `role-${Date.now()}`,
            name,
            permissions,
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={role ? 'Edit Role' : 'Add New Role'} size="3xl">
            <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto p-1">
                <div>
                    <label htmlFor="role-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role Name</label>
                    <Input
                        id="role-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Permissions</h3>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
                        {ALL_PERMISSIONS.map(p => (
                            <div key={p.id} className="relative flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id={`permission-${p.id}`}
                                        type="checkbox"
                                        checked={permissions.includes(p.id)}
                                        onChange={() => handlePermissionChange(p.id)}
                                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor={`permission-${p.id}`} className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                                        {p.id.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </label>
                                    <p className="text-gray-500 dark:text-gray-400">{p.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Role</Button>
                </div>
            </form>
        </Modal>
    );
};


interface StaffAndRolesProps {
    staff: Staff[];
    setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
    teams: Team[];
    roles: Role[];
    setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
    hasPermission: (permission: Permission) => boolean;
}

export const StaffAndRolesSection: React.FC<StaffAndRolesProps> = ({ staff, setStaff, teams, roles, setRoles, hasPermission }) => {
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    const handleSaveStaff = (staffMember: Staff) => {
        const isNew = !staff.some(s => s.id === staffMember.id);
        setStaff(prev => {
            if (isNew) {
                return [...prev, staffMember];
            }
            return prev.map(s => s.id === staffMember.id ? staffMember : s);
        });
    };

    const handleDeleteStaff = (staffId: string) => {
        const staffToDelete = staff.find(s => s.id === staffId);
        if(staffToDelete && window.confirm('Are you sure you want to delete this staff member?')) {
            setStaff(prev => prev.filter(s => s.id !== staffId));
        }
    };

    const handleSaveRole = (roleToSave: Role) => {
        const isNew = !roles.some(r => r.id === roleToSave.id);
        setRoles(prev => {
            if (isNew) {
                return [...prev, roleToSave];
            }
            return prev.map(r => r.id === roleToSave.id ? roleToSave : r);
        });
    };

    const handleDeleteRole = (roleId: string) => {
        const roleToDelete = roles.find(r => r.id === roleId);
        if (roleToDelete && window.confirm('Are you sure you want to delete this role? Staff assigned to this role will lose their permissions.')) {
            setRoles(prev => prev.filter(r => r.id !== roleId));
        }
    };

    return (
        <div>
            <SectionHeader 
                title="Staff & Teams"
                subtitle="Manage your team members, roles, and their permissions."
            />
            <div className="space-y-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
                    <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">Staff Members</h3>
                        <Button 
                            onClick={() => { setEditingStaff(null); setIsStaffModalOpen(true); }} 
                            size="sm"
                            disabled={!hasPermission('manageStaff')}
                        >
                            Add Staff
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-stone-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="p-4 text-sm font-semibold uppercase text-stone-500 dark:text-stone-400">Name</th>
                                    <th className="p-4 text-sm font-semibold uppercase text-stone-500 dark:text-stone-400">Email</th>
                                    <th className="p-4 text-sm font-semibold uppercase text-stone-500 dark:text-stone-400">Mobile</th>
                                    <th className="p-4 text-sm font-semibold uppercase text-stone-500 dark:text-stone-400">Team</th>
                                    <th className="p-4 text-sm font-semibold uppercase text-stone-500 dark:text-stone-400">Role</th>
                                    <th className="p-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200 dark:divide-gray-700">
                            {staff.map(s => (
                                <tr key={s.id}>
                                    <td className="p-4 font-medium whitespace-nowrap">{s.name}</td>
                                    <td className="p-4 text-stone-600 dark:text-stone-300 whitespace-nowrap">{s.email}</td>
                                    <td className="p-4 text-stone-600 dark:text-stone-300 whitespace-nowrap">{s.mobile || 'N/A'}</td>
                                    <td className="p-4 text-stone-600 dark:text-stone-300 whitespace-nowrap">{teams.find(t => t.id === s.teamId)?.name}</td>
                                    <td className="p-4 text-stone-600 dark:text-stone-300 text-sm font-semibold whitespace-nowrap">{roles.find(r => r.id === s.roleId)?.name || 'No Role'}</td>
                                    <td className="p-4 text-right whitespace-nowrap">
                                        <button onClick={() => { setEditingStaff(s); setIsStaffModalOpen(true); }} disabled={!hasPermission('manageStaff')} className="p-2 text-stone-500 hover:text-blue-600 disabled:opacity-50"><PencilIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteStaff(s.id)} disabled={!hasPermission('manageStaff')} className="p-2 text-stone-500 hover:text-red-600 disabled:opacity-50"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
                    <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">Roles & Permissions</h3>
                         <Button 
                            onClick={() => { setEditingRole(null); setIsRoleModalOpen(true); }}
                            size="sm"
                            disabled={!hasPermission('manageStaff')}
                        >
                            Add Role
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-stone-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="p-4 text-sm font-semibold uppercase text-stone-500 dark:text-stone-400">Role Name</th>
                                    <th className="p-4 text-sm font-semibold uppercase text-stone-500 dark:text-stone-400">Permissions Assigned</th>
                                    <th className="p-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200 dark:divide-gray-700">
                                {roles.map(role => (
                                    <tr key={role.id}>
                                        <td className="p-4 font-medium whitespace-nowrap">{role.name}</td>
                                        <td className="p-4 text-stone-600 dark:text-stone-300 text-sm">{role.permissions.length} of {ALL_PERMISSIONS.length}</td>
                                        <td className="p-4 text-right whitespace-nowrap">
                                            <button onClick={() => { setEditingRole(role); setIsRoleModalOpen(true); }} disabled={!hasPermission('manageStaff')} className="p-2 text-stone-500 hover:text-blue-600 disabled:opacity-50"><PencilIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleDeleteRole(role.id)} disabled={!hasPermission('manageStaff')} className="p-2 text-stone-500 hover:text-red-600 disabled:opacity-50"><TrashIcon className="w-5 h-5" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isStaffModalOpen && (
                <StaffModal 
                    isOpen={isStaffModalOpen} 
                    onClose={() => setIsStaffModalOpen(false)} 
                    onSave={handleSaveStaff}
                    staffMember={editingStaff}
                    teams={teams}
                    roles={roles}
                />
            )}
            {isRoleModalOpen && (
                <RoleModal
                    isOpen={isRoleModalOpen}
                    onClose={() => setIsRoleModalOpen(false)}
                    onSave={handleSaveRole}
                    role={editingRole}
                />
            )}
        </div>
    );
};
