import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

export default function StoreSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Store Settings</h1>
        <p className="text-muted-foreground mt-1">Configure global store settings and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Store Configuration</CardTitle>
          <CardDescription>Manage default settings for all stores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Store configuration options will be displayed here.</p>
          <Button>
            <Settings className="mr-2 h-4 w-4" />
            Configure Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
