import { useEffect, useState } from "react";
import { meiliClient } from "./meiliClient";

type IndexType = "users" | "posts" | "tasks";
type AnyDoc = Record<string, any>;

export default function App() {
  const [query, setQuery] = useState("");
  const [indexType, setIndexType] = useState<IndexType>("users");
  const [results, setResults] = useState<AnyDoc[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchJSON = async (filename: string) => {
    const res = await fetch(`/data/${filename}`);
    if (!res.ok) throw new Error(`Failed to load ${filename}`);
    return res.json();
  };

  const syncAll = async () => {
    const dataMap: { name: IndexType; file: string }[] = [
      { name: "users", file: "users.json" },
      { name: "posts", file: "posts.json" },
      { name: "tasks", file: "tasks.json" },
    ];

    for (const { name, file } of dataMap) {
      try {
        await meiliClient.createIndex(name, { primaryKey: "id" });
      } catch {} // already exists

      const data = await fetchJSON(file);
      await meiliClient.index(name).addDocuments(data);
    }

    console.log("✅ Synced data to Meilisearch");
  };

  const search = async () => {
    setLoading(true);
    try {
      const res = await meiliClient.index(indexType).search(query);
      setResults(res.hits);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncAll();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-4">🔍 Meilisearch Playground</h1>

      <div className="flex gap-2 mb-4">
        <select
          value={indexType}
          onChange={(e) => setIndexType(e.target.value as IndexType)}
          className="border rounded p-2"
        >
          <option value="users">Users</option>
          <option value="posts">Posts</option>
          <option value="tasks">Tasks</option>
        </select>

        <input
          type="text"
          className="border rounded p-2 flex-1"
          placeholder={`Search in ${indexType}...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <button
          onClick={search}
          className="bg-blue-600 text-white px-4 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {results.length === 0 && !loading && query && (
        <p className="text-gray-500">No results found.</p>
      )}

      <ul className="space-y-3">
        {results.map((doc) => (
          <li
            key={doc.id}
            className="p-4 border rounded shadow-sm text-sm bg-white whitespace-pre-wrap"
          >
            <strong>ID:</strong> {doc.id}
            <pre className="mt-2 text-xs text-gray-800 bg-gray-50 p-2 rounded overflow-x-auto">
              {JSON.stringify(doc, null, 2)}
            </pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
