import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Building2, Mail, MapPin, Save } from "lucide-react"

export default function BusinessProfilePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Business Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your business information and details</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="card-blue">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company Information
            </CardTitle>
            <CardDescription className="text-xs">Basic business details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="company-name" className="text-xs">
                Company Name
              </Label>
              <Input id="company-name" placeholder="Enter company name" defaultValue="My Business Ltd" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="business-type" className="text-xs">
                Business Type
              </Label>
              <Input id="business-type" placeholder="e.g., Retail, Wholesale" defaultValue="Retail" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="registration" className="text-xs">
                Registration Number
              </Label>
              <Input id="registration" placeholder="Business registration number" defaultValue="REG-2024-001" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-green">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact Information
            </CardTitle>
            <CardDescription className="text-xs">How customers can reach you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">
                Business Email
              </Label>
              <Input id="email" type="email" placeholder="contact@business.com" defaultValue="info@mybusiness.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs">
                Phone Number
              </Label>
              <Input id="phone" type="tel" placeholder="+1 234 567 8900" defaultValue="+1 555 123 4567" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website" className="text-xs">
                Website
              </Label>
              <Input id="website" type="url" placeholder="https://business.com" defaultValue="https://mybusiness.com" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-purple md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Business Address
            </CardTitle>
            <CardDescription className="text-xs">Physical location details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="street" className="text-xs">
                  Street Address
                </Label>
                <Input id="street" placeholder="123 Main Street" defaultValue="456 Business Avenue" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs">
                  City
                </Label>
                <Input id="city" placeholder="City" defaultValue="New York" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state" className="text-xs">
                  State/Province
                </Label>
                <Input id="state" placeholder="State" defaultValue="NY" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zip" className="text-xs">
                  ZIP/Postal Code
                </Label>
                <Input id="zip" placeholder="12345" defaultValue="10001" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country" className="text-xs">
                Country
              </Label>
              <Input id="country" placeholder="Country" defaultValue="United States" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-amber md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Business Description</CardTitle>
            <CardDescription className="text-xs">Tell customers about your business</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Describe your business..."
              className="min-h-[100px] text-sm"
              defaultValue="We are a leading retail business providing quality products and excellent customer service since 2020."
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm">
          Cancel
        </Button>
        <Button size="sm">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
