import { useState, useEffect, useCallback, useMemo } from "react";
import { apiRequest } from "@/lib/api";
import { fetchQuestions, type RawQuestion } from "@/lib/fetchQuestions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CustomLoader } from "@/components";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogDescriptionComponent,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Exam, Question, SubjectConfig, Batch, User } from "@/lib/types";
import {
  QUESTIONS_PER_PAGE,
  QUESTIONS_PER_PAGE_MOBILE,
  CRITICAL_TIME_THRESHOLD,
  TIMER_CLASSES,
  BREAKPOINTS,
} from "@/lib/examConstants";
import { ExamInstructions } from "@/components/ExamInstruction";
import LatexRenderer from "@/components/LatexRenderer";
import { createTemporaryGuestUser, saveGuestUserToSession, isTemporaryGuestUser } from "@/lib/guest-utils";
import {
  Clock,
  Flag,
  ArrowLeft,
  Eye,
  ArrowRight,
  Send,
  CheckCircle2,
  BookOpen,
  Zap,
  ListChecks,
  HelpCircle,
} from "lucide-react";
import { cn, validateExamTime, formatExamDateTime } from "@/lib/utils";

export const runtime = "edge";

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  return `${minutes}m ${secs}s`;
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const subjectsMap: { [key: string]: string } = {
  p: "পদার্থবিজ্ঞান",
  c: "রসায়ন",
  m: "উচ্চতর গণিত",
  b: "জীববিজ্ঞান",
  bm: "জীববিজ্ঞান + উচ্চতর গণিত",
  bn: "বাংলা",
  e: "ইংরেজী",
  i: "আইসিটি",
  gk: "জিকে",
  iq: "আইকিউ",
};

const getSubjectName = (id: string) => subjectsMap[id] || id;

function GuestIdentificationScreen({
  onIdentify,
  examName,
}: {
  onIdentify: (user: User) => void;
  examName: string;
}) {
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roll.trim()) {
      toast({ title: "নাম এবং রোল দিন", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Create a temporary guest user without calling the backend API
      const tempUser = createTemporaryGuestUser(name, roll);
      
      // Save to session storage for persistence during this session
      saveGuestUserToSession(tempUser);
      
      // Call the onIdentify callback with the temporary user
      onIdentify(tempUser);
    } catch (error) {
      console.error("Error creating guest user:", error);
      toast({
        title: "ত্রুটি",
        description: "গেস্ট ইউজার তৈরি করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-1 md:p-2 lg:p-4 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-primary">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">আপনার পরিচয় দিন</CardTitle>
          <CardDescription>
            {examName} - এ অংশগ্রহণের জন্য আপনার নাম ও রোল দিন।
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">আপনার নাম</Label>
              <Input
                id="name"
                placeholder="যেমন: আবরার আহমেদ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roll">রোল নম্বর / ফোন</Label>
              <Input
                id="roll"
                placeholder="যেমন: ১০১ বা ০১৭..."
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <CustomLoader minimal /> : "এগিয়ে যান"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}