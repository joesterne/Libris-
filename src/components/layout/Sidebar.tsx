import React from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { UserProfile } from '../../types';
import { NAV_ITEMS, TabId } from '../../lib/constants';
import { ProfileDialog } from '../dialogs/ProfileDialog';
import { Button } from '../ui/button';
import { LogOut } from 'lucide-react';
import { logout } from '../../firebase';

interface SidebarProps {
  activeTab: TabId;
  selectedBookId: string | null;
  onTabChange: (tab: TabId) => void;
  user: FirebaseUser;
  profile: UserProfile | null;
  onUpdateGoal: (goal: number) => Promise<void>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  selectedBookId,
  onTabChange,
  user,
  profile,
  onUpdateGoal,
}) => {
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  return (
    <aside className="fixed left-0 top-0 h-full w-20 md:w-64 bg-white border-r border-black/5 z-50 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-black tracking-tighter hidden md:block">
          LIBRIS
        </h1>
        <div className="w-8 h-8 bg-black rounded-lg md:hidden mx-auto" />
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id && !selectedBookId
                ? 'bg-black text-white shadow-lg'
                : 'text-muted-foreground hover:bg-black/5 hover:text-black'
            }`}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="font-bold text-sm hidden md:block">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-black/5">
        <ProfileDialog
          open={isProfileOpen}
          onOpenChange={setIsProfileOpen}
          user={user}
          profile={profile}
          onSave={onUpdateGoal}
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start text-muted-foreground hover:text-red-600"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span className="hidden md:block">Logout</span>
        </Button>
      </div>
    </aside>
  );
};
