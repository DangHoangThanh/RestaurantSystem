import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '@/services/analyticsApi';
import { useAuth } from '@/context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import type { AuthPayload } from '@/types';
import { toast } from '@/lib/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const ROLE_ROUTES: Record<string, string> = {
    server: '/server',
    chef: '/kitchen',
    cashier: '/cashier',
    manager: '/manager',
    admin: '/admin',
};

export function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const submit = async () => {
        try {
            const { token } = await analyticsApi.login(username, password);
            const decoded = jwtDecode<AuthPayload>(token);
            login(token);
            toast.fire({ icon: 'success', title: `Welcome back, ${username}!` });
            navigate(ROLE_ROUTES[decoded.role] ?? '/login');
        } catch {
            setError('Invalid username or password');
            toast.fire({ icon: 'error', title: 'Login failed' });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-sm shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl text-center font-bold">Restaurant System</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Input 
                            placeholder="Username" 
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Input 
                            type="password" 
                            placeholder="Password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && submit()}
                        />
                    </div>
                    
                    {error && (
                        <div className="text-sm text-destructive font-medium">
                            {error}
                        </div>
                    )}

                    <Button className="w-full" onClick={submit}>
                        Login
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}