//src/components/ui.jsx

const STATUS_COLORS = {
    Open: "bg-green-100 text-green-800",
    Close: "bg-yellow-100 text-yellow-800",
    Cancel: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }) {
    return (
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] || "bg-gray-100"}`}>
      {status}
    </span>
    );
}

export function Alert({ msg }) {
    if (!msg) return null;
    const color = msg.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700";
    return <p className={`mb-4 rounded p-3 text-sm ${color}`}>{msg.text}</p>;
}