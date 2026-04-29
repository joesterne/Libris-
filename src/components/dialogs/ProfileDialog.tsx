import React, { useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { UserProfile } from '../../types';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../ui/dialog';
import { Settings } from 'lucide-react';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: FirebaseUser;
  profile: UserProfile | null;
  onSave: (goal: number) => Promise<void>;
}

export const ProfileDialog: React.FC<ProfileDialogProps> = ({
  open,
  onOpenChange,
  user,
  profile,
  onSave,
}) => {
  const [tempGoal, setTempGoal] = useState(profile?.readingGoal || 12);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && profile) {
      setTempGoal(profile.readingGoal);
    }
  };

  const handleSave = async () => {
    await onSave(tempGoal);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger>
        <div className="w-full flex items-center gap-3 p-2 rounded-xl bg-black/5 mb-4 hover:bg-black/10 transition-colors text-left cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-black/10 overflow-hidden shrink-0">
            <img src={user.photoURL || ''} alt="" referrerPolicy="no-referrer" />
          </div>
          <div className="hidden md:block overflow-hidden flex-1">
            <p className="text-xs font-bold truncate">{user.displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
          <Settings className="w-3 h-3 text-muted-foreground hidden md:block" />
        </div>
      </DialogTrigger>
      <DialogContent className="rounded-3xl border-none shadow-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">
            Profile Settings
          </DialogTitle>
          <DialogDescription>
            Manage your reading preferences and goals.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-8 py-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-4 border-black/5">
              <AvatarImage src={user.photoURL || ''} />
              <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-lg">{user.displayName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-bold text-sm">Annual Reading Goal</Label>
              <span className="text-xl font-black">{tempGoal} books</span>
            </div>
            <Slider
              value={[tempGoal]}
              onValueChange={(v) => setTempGoal(v[0])}
              max={100}
              min={1}
              step={1}
              className="py-4"
            />
            <p className="text-xs text-muted-foreground italic">
              Setting a goal helps you stay motivated throughout the year.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSave}
            className="w-full rounded-xl h-12 font-bold text-lg"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
