import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import NormalLicenseDetailView from './normal-license-detail-view'
import BlockchainLicenseDetailView from './blockchain-license-detail-view'

interface Props {
  id: string
}

const LicenseDetailView: React.FC<Props> = (props) => {
  return (
    <Tabs defaultValue='normal'>
      <TabsList>
        <TabsTrigger value='normal'>Giấy phép thông thường</TabsTrigger>
        <TabsTrigger value='blockchain'>Giấy phép blockchain</TabsTrigger>
      </TabsList>
      <TabsContent value='normal'>
        <NormalLicenseDetailView id={props.id} />
      </TabsContent>
      <TabsContent value='blockchain'>
        <BlockchainLicenseDetailView id={props.id} />
      </TabsContent>
    </Tabs>
  )
}

export default LicenseDetailView
