import Header from "@/components/Header";
import LocationTodoCard from "@/components/LocationTodoCard";
import IntakeForm from "@/components/IntakeForm";
import CallbackList from "@/components/CallbackList";

export default function Home() {
  return (
    <>
      <Header />
      <main className="dashboard">
        {/* Row 1: Taken per vestiging */}
        <h2 className="dashboard__section-title">Taken</h2>
        <div className="dashboard__row dashboard__row--todos">
          <LocationTodoCard location="regiobar" />
          <LocationTodoCard location="capelle" />
          <LocationTodoCard location="nissewaard" />
        </div>

        {/* Row 2: Nieuwe aanvragen per vestiging */}
        <h2 className="dashboard__section-title">Nieuwe aanvragen</h2>
        <div className="dashboard__row dashboard__row--intakes">
          <IntakeForm location="regiobar" />
          <IntakeForm location="capelle" />
          <IntakeForm location="nissewaard" />
        </div>

        {/* Row 3: Terugbelafspraken per vestiging */}
        <h2 className="dashboard__section-title">Terugbelafspraken</h2>
        <div className="dashboard__row dashboard__row--callbacks">
          <CallbackList location="regiobar" />
          <CallbackList location="capelle" />
          <CallbackList location="nissewaard" />
        </div>
      </main>
    </>
  );
}
