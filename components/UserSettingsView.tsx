import React, { useState, useEffect } from 'react';
import type { Staff, Role } from '../types';
import { UserCircleIcon, SunIcon, MoonIcon, SaveIcon } from './icons';
import { Button, Input, Select } from './common';

interface UserSettingsViewProps {
    currentUser: Staff;
    allStaff: Staff[];
    roles: Role[];
    onUpdateUser: (updatedUser: Staff) => void;
    setCurrentUser: (user: Staff) => void;
    theme: string;
    toggleTheme: () => void;
}

export const UserSettingsView: React.FC<UserSettingsViewProps> = ({
    currentUser,
    allStaff,
    roles,
    onUpdateUser,
    setCurrentUser,
    theme,
    toggleTheme,
}) => {
    const [name, setName] = useState(currentUser.name);
    const [email, setEmail] = useState(currentUser.email);
    const [mobile, setMobile] = useState(currentUser.mobile || '');

    useEffect(() => {
        setName(currentUser.name);
        setEmail(currentUser.email);
        setMobile(currentUser.mobile || '');
    }, [currentUser]);

    const userRole = roles.find(r => r.id === currentUser.roleId);

    const handleSave = () => {
        onUpdateUser({
            ...currentUser,
            name,
            email,
            mobile,
            initials: name.split(' ').map(n => n[0]).join('').toUpperCase()
        });
    };
    
    const handleSwitchUser = (staffId: string) => {
        const newCurrentUser = allStaff.find(s => s.id === staffId);
        if (newCurrentUser) {
            setCurrentUser(newCurrentUser);
        }
    };

    return (
        <div className="bg-stone-50 dark:bg-gray-900 flex flex-col h-full">
            <header className="flex-shrink-0 bg-white dark:bg-gray-800 p-4 border-b border-stone-200 dark:border-gray-700 z-10">
                <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <UserCircleIcon className="w-8 h-8 text-stone-600 dark:text-stone-300" />
                        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">User Settings</h1>
                    </div>
                </div>
            </header>
            <main className="flex-grow p-8 overflow-y-auto">
                <div className="max-w-3xl mx-auto space-y-8">
                    {/* My Profile Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
                        <h3 className="font-semibold text-lg mb-4">My Profile</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Full Name</label>
                                    <Input value={name} onChange={e => setName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Email Address</label>
                                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Mobile</label>
                                    <Input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Role</label>
                                    <Input value={userRole?.name || 'N/A'} disabled className="bg-stone-100 dark:bg-gray-700/50" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button onClick={handleSave} icon={SaveIcon}>Save Profile</Button>
                        </div>
                    </div>

                    {/* Appearance Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
                        <h3 className="font-semibold text-lg mb-4">Appearance</h3>
                        <div className="flex items-center justify-between">
                            <p className="text-sm">Switch between light and dark themes.</p>
                            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">
                                {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Quick User Switch Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
                        <h3 className="font-semibold text-lg mb-4">Quick User Switch (Demo Feature)</h3>
                        <p className="text-sm text-stone-500 mb-3">Easily switch between users to test different roles and permissions throughout the application.</p>
                        <Select value={currentUser.id} onChange={e => handleSwitchUser(e.target.value)}>
                            {allStaff.map(staff => (
                                <option key={staff.id} value={staff.id}>{staff.name} ({roles.find(r => r.id === staff.roleId)?.name})</option>
                            ))}
                        </Select>
                    </div>
                </div>
            </main>
        </div>
    );
};
