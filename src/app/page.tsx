import Header from "@/components/Header";
import LocationTodoCard from "@/components/LocationTodoCard";
import CalendarCard from "@/components/CalendarCard";
import IntakeForm from "@/components/IntakeForm";
import MailCard from "@/components/MailCard";

export default function Home() {
  return (
    <>
      <Header />
      <main className="dashboard">
        {/* Row 1: Three location todo cards */}
        <div className="dashboard__row dashboard__row--todos">
          <LocationTodoCard location="regiobar" />
          <LocationTodoCard location="capelle" />
          <LocationTodoCard location="nissewaard" />
        </div>

        {/* Row 2: Agenda (full width) */}
        <div className="dashboard__row dashboard__row--full">
          <CalendarCard />
        </div>

        {/* Row 3: Intakes + Mail */}
        <div className="dashboard__row dashboard__row--bottom">
          <IntakeForm />
          <MailCard />
        </div>
      </main>
    </>
  );
}
