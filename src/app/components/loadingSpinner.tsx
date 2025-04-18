import { ImSpinner2 } from "react-icons/im";

export default function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
          <ImSpinner2 className="animate-spin text-blue-400 w-17 h-17 " />
        </div>
    )
}