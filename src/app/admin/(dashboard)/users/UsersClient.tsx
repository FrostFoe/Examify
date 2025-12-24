"use client";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Check,
  Copy,
  Edit,
  MoreHorizontal,
  PlusCircle,
  Search,
  Trash2,
  User as UserIcon,
  UserPlus,
  ArrowLeft,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConfirmPasswordDialog from "@/components/ConfirmPasswordDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserForm } from "@/components/landing/user-form";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { User, Batch, UserFormResult } from "@/lib/types";
import { createUser, updateUser, deleteUser } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CustomLoader } from "@/components";

interface UsersClientProps {
  initialUsers: User[];
  initialBatches: Batch[];
}

// Dialog to show newly created user's credentials
function NewUserCredentialsDialog({
  user,
  open,
  onOpenChange,
}: {
  user: (User & { pass: string }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [copiedRoll, setCopiedRoll] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  if (!user) return null;

  const copyToClipboard = (text: string, type: "roll" | "pass") => {
    navigator.clipboard.writeText(text);
    if (type === "roll") {
      setCopiedRoll(true);
      setTimeout(() => setCopiedRoll(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>নতুন ব্যবহারকারী তৈরি হয়েছে</DialogTitle>
          <DialogDescription>
            ব্যবহারকারী নিম্নলিখিত তথ্য দিয়ে তৈরি করা হয়েছে। অনুগ্রহ করে এই
            তথ্য ব্যবহারকারীর সাথে শেয়ার করুন।
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>নাম</Label>
            <Input value={user.name} readOnly />
          </div>
          <div className="space-y-2">
            <Label>রোল নম্বর</Label>
            <div className="flex items-center gap-2">
              <Input value={user.roll || ""} readOnly className="font-mono" />
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(user.roll || "", "roll")}
              >
                {copiedRoll ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>পাসওয়ার্ড</Label>
            <div className="flex items-center gap-2">
              <Input value={user.pass} readOnly className="font-mono" />
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(user.pass, "pass")}
              >
                {copiedPass ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>বন্ধ করুন</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UsersClient({
  initialUsers,
  initialBatches,
}: UsersClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [batches] = useState<Batch[]>(initialBatches);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUserCredentials, setNewUserCredentials] = useState<
    (User & { pass: string }) | null
  >(null);
  const [userToEnroll, setUserToEnroll] = useState<User | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsUserDialogOpen(true);
  };

  const openDeleteConfirm = (user: User) => {
    setUserToDelete(user);
    setIsPasswordOpen(true);
  };

  const openEnrollDialog = (user: User) => {
    setUserToEnroll(user);
    setIsEnrollDialogOpen(true);
  };

  const { admin } = useAdminAuth();

  const handleDeleteUserConfirmed = async (password: string) => {
    if (!userToDelete) return;

    if (!admin) {
      toast({ variant: "destructive", title: "প্রমাণীকরণ ত্রুটি" });
      setIsPasswordOpen(false);
      setUserToDelete(null);
      return;
    }

    const formData = new FormData();
    formData.append("uid", userToDelete.uid);
    formData.append("password", password);
    formData.append("admin_uid", admin.uid);

    const result = await deleteUser(formData);

    if (!result.success) {
      toast({
        variant: "destructive",
        title: "ব্যর্থ হয়েছে",
        description: result.message,
      });
    } else {
      setUsers(users.filter((user) => user.uid !== userToDelete.uid));
      toast({
        title: "সফল",
        description: `ব্যবহারকারী ${userToDelete.name} মুছে ফেলা হয়েছে।`,
      });
    }

    setIsPasswordOpen(false);
    setUserToDelete(null);
  };

  const handleFormSuccess = (data?: User | UserFormResult | null) => {
    setIsUserDialogOpen(false);

    if (!data) return;

    if (!selectedUser && "pass" in data && data.pass) {
      // Create mode
      setNewUserCredentials(data as User & { pass: string });
      setUsers((prev) => [...prev, data as User]);
      toast({
        title: "সফল",
        description: "নতুন ব্যবহারকারী সফলভাবে তৈরি হয়েছে।",
      });
    } else if (selectedUser && "uid" in data) {
      // Edit mode
      setUsers((prev) =>
        prev.map((u) => (u.uid === data.uid ? (data as User) : u)),
      );
      toast({
        title: "সফল",
        description: "ব্যবহারকারী সফলভাবে আপডেট করা হয়েছে।",
      });
    }
  };

  const handleEnrollStudent = async () => {
    if (!userToEnroll || !selectedBatch) return;

    setIsEnrolling(true);

    const userToUpdate = users.find((u) => u.uid === userToEnroll.uid);
    if (!userToUpdate) {
      toast({
        variant: "destructive",
        title: "ত্রুটি",
        description: "ব্যবহারকারী খুঁজে পাওয়া যায়নি।",
      });
      setIsEnrolling(false);
      return;
    }

    if (
      userToUpdate.enrolled_batches &&
      userToUpdate.enrolled_batches.includes(selectedBatch)
    ) {
      toast({
        variant: "destructive",
        title: "ভর্তি ব্যর্থ হয়েছে",
        description: "এই ব্যবহারকারী ইতিমধ্যে এই ব্যাচে আছেন।",
      });
    } else {
      const result = await apiRequest<User>(
        "students",
        "POST",
        {
          uid: userToEnroll.uid,
          batch_id: selectedBatch,
        },
        { action: "enroll" },
      );

      if (!result.success || !result.data) {
        toast({
          variant: "destructive",
          title: "ভর্তি ব্যর্থ হয়েছে",
          description: "ব্যবহারকারীকে ব্যাচে ভর্তি করা যায়নি।",
        });
      } else {
        const updatedUser = result.data;
        setUsers(
          users.map((u) => (u.uid === updatedUser.uid ? updatedUser : u)),
        );
        toast({
          title: "সফল",
          description: `${userToEnroll.name} ব্যাচে ভর্তি হয়েছেন।`,
        });
        setIsEnrollDialogOpen(false);
        setUserToEnroll(null);
        setSelectedBatch(null);
      }
    }
    setIsEnrolling(false);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (searchTerm) {
      params.set("search", searchTerm);
    } else {
      params.delete("search");
    }
    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <>
      <div className="mb-4">
        <Link
          href="/admin/settings"
          className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          সেটিংস-এ ফিরে যান
        </Link>
      </div>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
            <div>
              <CardTitle>ব্যবহারকারীগণ</CardTitle>
              <CardDescription>
                আপনার প্ল্যাটফর্মে সমস্ত নিবন্ধিত ব্যবহারকারীদের পরিচালনা করুন।
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <form onSubmit={handleSearch} className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="নাম বা রোল দিয়ে খুঁজুন..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </form>
              <Dialog
                open={isUserDialogOpen}
                onOpenChange={setIsUserDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1" onClick={handleAddUser}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      নতুন ব্যবহারকারী
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] w-[95vw] rounded-2xl md:max-w-lg p-4 md:p-6 overflow-hidden flex flex-col">
                  <DialogHeader className="shrink-0">
                    <DialogTitle>
                      {selectedUser
                        ? "ব্যবহারকারী সম্পাদনা করুন"
                        : "নতুন ব্যবহারকারী যোগ করুন"}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedUser
                        ? "এই ব্যবহারকারীর তথ্য পরিবর্তন করুন।"
                        : "একটি পাসওয়ার্ড স্বয়ংক্রিয়ভাবে তৈরি হবে।"}
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="flex-1 -mr-2 pr-2">
                    <div className="pt-2 pb-1">
                      <UserForm
                        isCreateMode={!selectedUser}
                        defaultValues={selectedUser}
                        action={selectedUser ? updateUser : createUser}
                        onSuccess={handleFormSuccess}
                        batches={initialBatches}
                      />
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.length > 0 ? (
              users.map((user) => (
                <Card key={user.uid} className="flex flex-col">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        <UserIcon className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        রোল: {user.roll}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>কার্যক্রম</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>সম্পাদনা</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openEnrollDialog(user)}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          <span>ব্যাচে ভর্তি করুন</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => openDeleteConfirm(user)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>মুছে ফেলুন</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm font-medium mb-2">ভর্তি হওয়া কোর্স</p>
                    <div className="flex flex-wrap gap-1">
                      {user.enrolled_batches &&
                      user.enrolled_batches.length > 0 ? (
                        user.enrolled_batches.map((batchId) => {
                          const batch = batches.find((b) => b.id === batchId);
                          return batch ? (
                            <Link
                              href={`/admin/batches/${batch.id}`}
                              key={batch.id}
                            >
                              <Badge
                                variant="secondary"
                                className="cursor-pointer hover:bg-secondary/80"
                              >
                                {batch.name}
                              </Badge>
                            </Link>
                          ) : null;
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          কোনো ব্যাচে নেই
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p>কোনো ব্যবহারকারী পাওয়া যায়নি।</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmPasswordDialog
        open={isPasswordOpen}
        onOpenChange={(open) => {
          setIsPasswordOpen(open);
          if (!open) setUserToDelete(null);
        }}
        title="ব্যবহারকারী মুছে ফেলা নিশ্চিত করুন"
        description={
          userToDelete
            ? `আপনি ${userToDelete.name} (রোল: ${userToDelete.roll}) কে মুছে ফেলতে চলেছেন। এই কাজটি необратиযোগ্য। আপনার অ্যাডমিন পাসওয়ার্ড দিন:`
            : undefined
        }
        confirmLabel="মুছে ফেলুন"
        onConfirm={handleDeleteUserConfirmed}
      />

      <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ব্যাচে ভর্তি করুন</DialogTitle>
            <DialogDescription>
              {userToEnroll?.name}-কে একটি ব্যাচে ভর্তি করুন।
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Select onValueChange={setSelectedBatch} disabled={isEnrolling}>
              <SelectTrigger>
                <SelectValue placeholder="একটি ব্যাচ নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleEnrollStudent} disabled={isEnrolling}>
            {isEnrolling ? (
              <>
                <CustomLoader />
                ভর্তি করা হচ্ছে...
              </>
            ) : (
              "ভর্তি নিশ্চিত করুন"
            )}
          </Button>
        </DialogContent>
      </Dialog>

      <NewUserCredentialsDialog
        user={newUserCredentials}
        open={!!newUserCredentials}
        onOpenChange={(open) => {
          if (!open) {
            setNewUserCredentials(null);
          }
        }}
      />
    </>
  );
}
