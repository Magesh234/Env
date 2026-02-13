import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Plug, CheckCircle2, XCircle, Settings2 } from "lucide-react"

const integrations = [
  {
    name: "Payment Gateway",
    description: "Accept online payments from customers",
    status: "connected",
    provider: "Stripe",
  },
  {
    name: "Email Service",
    description: "Send automated emails and notifications",
    status: "connected",
    provider: "SendGrid",
  },
  {
    name: "SMS Notifications",
    description: "Send SMS alerts to customers",
    status: "disconnected",
    provider: "Twilio",
  },
  {
    name: "Accounting Software",
    description: "Sync financial data automatically",
    status: "disconnected",
    provider: "QuickBooks",
  },
  {
    name: "Shipping Provider",
    description: "Integrate with shipping carriers",
    status: "connected",
    provider: "ShipStation",
  },
  {
    name: "Analytics",
    description: "Track business metrics and insights",
    status: "connected",
    provider: "Google Analytics",
  },
]

export default function IntegrationsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground">Connect your business with third-party services</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((integration, index) => (
          <Card
            key={integration.name}
            className={`card-${["blue", "green", "purple", "amber", "cyan", "slate"][index % 6]}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Plug className="h-4 w-4" />
                  <CardTitle className="text-base">{integration.name}</CardTitle>
                </div>
                {integration.status === "connected" ? (
                  <Badge variant="default" className="bg-green-500 text-white text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">{integration.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Provider:</span>
                <span className="font-medium">{integration.provider}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch id={`enable-${integration.name}`} checked={integration.status === "connected"} />
                  <Label htmlFor={`enable-${integration.name}`} className="text-xs cursor-pointer">
                    Enable
                  </Label>
                </div>
                <Button variant="outline" size="sm">
                  <Settings2 className="h-3 w-3 mr-1" />
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
