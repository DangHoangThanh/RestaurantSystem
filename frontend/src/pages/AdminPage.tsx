import { useState } from 'react';
import { analyticsApi } from '@/services/analyticsApi';
import { TopHeader } from '@/components/TopHeader';
import { Shield, Clock, CheckCircle2 } from 'lucide-react';
import type { Role } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ROLES: Role[] = ['server', 'chef', 'cashier', 'manager', 'admin'];

export function AdminPage() {
    const [form, setForm] = useState({ username: '', password: '', role: 'server' as Role });
    const [message, setMessage] = useState('');

    const submit = async () => {
        try {
            await analyticsApi.createUser(form);
            setMessage(`Account "${form.username}" created successfully (${form.role})`);
            setForm({ username: '', password: '', role: 'server' });
        } catch (e: any) { setMessage(`Error: ${e.message}`); }
    };

    return (
        <div className="min-h-screen flex flex-col bg-muted/30">
            <TopHeader title="Admin" icon={<Shield className="h-5 w-5" />}>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
                    <Clock className="size-4" />
                    <span className="font-medium">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </TopHeader>
            <main className="flex-1 p-4 md:p-6 container mx-auto max-w-3xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Create Account</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 max-w-md">
                        <div className="space-y-4">
                            <Input
                                type="text"
                                placeholder="Username"
                                value={form.username}
                                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                            />
                            <Input
                                type="password"
                                placeholder="Password"
                                value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            />
                            <Select 
                                value={form.role} 
                                onValueChange={(value: Role) => setForm(f => ({ ...f, role: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map(r => (
                                        <SelectItem key={r} value={r} className="capitalize">
                                            {r}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            
                            <Button className="w-full" onClick={submit}>
                                Create Account
                            </Button>

                            {message && (
                                <div className="mt-4 p-3 bg-success/15 text-success rounded-md text-sm font-medium flex items-center gap-2 border border-success/30">
                                    <CheckCircle2 className="size-4" />
                                    {message}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}