import Header from "@/components/Header";
import LocationTodoCard from "@/components/LocationTodoCard";
import IntakeForm from "@/components/IntakeForm";
import CallbackList from "@/components/CallbackList";

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

        {/* Row 2: Intakes + Belafspraken */}
        <div className="dashboard__row dashboard__row--bottom">
          <IntakeForm />
          <CallbackList />
        </div>
      </main>
    </>
  );
}
