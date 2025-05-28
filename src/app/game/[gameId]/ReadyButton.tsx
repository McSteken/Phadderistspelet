export default function ReadyButton({
  isReady,
  onClick,
}: {
  isReady: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isReady}
      className={`px-6 py-2 rounded text-white font-semibold transition duration-300 ${
        isReady ? "bg-green-600" : "bg-purple-600 hover:bg-purple-800"
      }`}
    >
      {isReady ? "Väntar på motståndaren..." : "Jag är redo"}
    </button>
  );
}
