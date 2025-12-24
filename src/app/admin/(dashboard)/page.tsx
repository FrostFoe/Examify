import { StatCard } from "@/components";
import { apiRequest } from "@/lib/api";
import { Users, BookOpen, FileQuestion } from "lucide-react";

async function getStats() {
  const result = await apiRequest<{
    usersCount: number;
    examsCount: number;
    questionsCount: number;
  }>("stats");

  if (!result.success || !result.data) {
    console.error("Error fetching stats:", result.message);
    return {
      usersCount: 0,
      examsCount: 0,
      questionsCount: 10000,
    };
  }

  return result.data;
}

export default async function AdminDashboard() {
  const { usersCount, examsCount, questionsCount } = await getStats();
  const cards = [
    {
      title: "মোট ব্যবহারকারী",
      value: usersCount.toLocaleString("bn-BD"),
      description: "নিবন্ধিত মোট ছাত্রছাত্রীর সংখ্যা",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "মোট পরীক্ষা",
      value: examsCount.toLocaleString("bn-BD"),
      description: "সিস্টেমে থাকা মোট পরীক্ষার সংখ্যা",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      title: "মোট প্রশ্ন",
      value: `${(questionsCount / 1000).toLocaleString("bn-BD")}K+`,
      description: "প্রশ্নব্যাংকে থাকা মোট প্রশ্ন",
      icon: <FileQuestion className="h-5 w-5" />,
    },
  ];

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-500">
        {cards.map((card, idx) => (
          <div key={idx} style={{ animationDelay: `${idx * 150}ms` }}>
            <StatCard
              title={card.title}
              value={card.value}
              description={card.description}
              icon={card.icon}
            />
          </div>
        ))}
      </div>
      <hr className="h-8 border-transparent" />
    </>
  );
}
