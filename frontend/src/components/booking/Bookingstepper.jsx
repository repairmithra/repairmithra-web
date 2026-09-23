import { LuCheck } from "react-icons/lu";

const STEPS = ["Address & Schedule", "Payment", "Confirmation"];

// current: 1 = Address & Schedule, 2 = Payment, 3 = Confirmation
function BookingStepper({ current }) {
  return (
    <ol className="flex items-start" aria-label="Booking progress">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const isDone = step < current;
        const isActive = step === current;

        return (
          <li
            key={label}
            aria-current={isActive ? "step" : undefined}
            className="relative flex flex-1 flex-col items-center text-center"
          >
            {/* Connector to the previous step */}
            {index > 0 && (
              <span
                aria-hidden="true"
                className={`absolute left-[-50%] top-4 h-0.5 w-full ${
                  step <= current ? "bg-blue-600" : "bg-slate-200"
                }`}
              />
            )}

            <span
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ring-4 ring-white ${
                isDone
                  ? "bg-green-600 text-white"
                  : isActive
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {isDone ? <LuCheck size={16} strokeWidth={3} /> : step}
            </span>

            <span
              className={`mt-2 text-xs sm:text-sm ${
                isActive ? "font-semibold text-blue-700" : "text-slate-500"
              }`}
            >
              {label}
              {isDone && <span className="sr-only"> (completed)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default BookingStepper;