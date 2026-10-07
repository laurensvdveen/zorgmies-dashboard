import Header from "@/components/Header";
import Clock from "@/components/Clock";
import WeatherCard from "@/components/WeatherCard";
import CalendarCard from "@/components/CalendarCard";
import MailCard from "@/components/MailCard";
import TodoList from "@/components/TodoList";
import CallbackList from "@/components/CallbackList";
import IntakeForm from "@/components/IntakeForm";

export default function Home() {
  return (
    <>
      <Header />
      <main className="dashboard">
        {/* Row 1: Quick info */}
        <Clock />
        <WeatherCard />
        <CalendarCard />

        {/* Row 2: Communication & tasks */}
        <MailCard />
        <TodoList />
        <CallbackList />

        {/* Row 3: Intake (full width) */}
        <div style={{ gridColumn: "1 / -1" }}>
          <IntakeForm />
        </div>
      </main>
    </>
  );
}
