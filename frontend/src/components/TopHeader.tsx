import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from './ui/button';
import { LogOut } from 'lucide-react';

type TopHeaderProps = {
    title: string;
    icon?: React.ReactNode;
    children?: React.ReactNode;
    centerContent?: React.ReactNode;
};

export function TopHeader({ title, icon, children, centerContent }: TopHeaderProps) {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6">
                <div className="flex flex-1 items-center gap-3">
                    <div className="flex items-center gap-2">
                        {icon && (
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                {icon}
                            </div>
                        )}
                        <div>
                            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                            <p className="text-xs text-muted-foreground">Restaurant System</p>
                        </div>
                    </div>
                </div>

                {centerContent && (
                    <div className="flex flex-1 items-center justify-center px-4">
                        {centerContent}
                    </div>
                )}

                <div className="flex flex-1 items-center justify-end gap-2">
                    {children}
                    <Button variant="outline" size="sm" onClick={handleLogout} className="ml-2">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </div>
        </header>
    );
}
