export default function TaskListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 rounded-lg glass-card animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-sm bg-gray-700"></div>
            <div className="h-4 w-48 bg-gray-700 rounded"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-16 bg-gray-700 rounded-full"></div>
            <div className="h-8 w-8 bg-gray-700 rounded-md"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
