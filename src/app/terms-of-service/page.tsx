const TermsOfService = () => {
  return (
    <main className='mx-auto flex max-w-4xl flex-col items-center gap-6 py-8 font-medium'>
      <h1 className='text-4xl font-bold'>Terms of Service</h1>
      <div className='flex flex-col gap-1'>
        <p className='font-semibold'>1. Acceptance of Terms</p>
        <p>
          By accessing or using Grails, you agree to these Terms of Service (“Terms”). If you do not agree, do not use
          the service.
        </p>
      </div>

      <div className='flex w-full flex-col gap-1'>
        <p className='font-semibold'>2. Description of the Service</p>
        <p>Grails is an online manager and market interface for Ethereum Name Service (“ENS”) names.</p>
        <p>Grails does not:</p>
        <ul className='list-inside list-disc'>
          <li>Custody user funds or ENS names</li>
          <li>Act as a financial advisor</li>
          <li>Control the Ethereum blockchain or ENS protocol</li>
        </ul>
      </div>

      <div className='flex w-full flex-col gap-1'>
        <p className='font-semibold'>3. User Responsibility</p>
        <p>You are solely responsible for:</p>
        <ul className='list-inside list-disc'>
          <li>Your wallet, private keys, and transactions</li>
          <li>All actions taken through your wallet</li>
          <li>Understanding the risks of blockchain technology</li>
          <li>Blockchain transactions are irreversible.</li>
        </ul>
      </div>

      <div className='flex w-full flex-col gap-1'>
        <p className='font-semibold'>4. No Warranties</p>
        <p>
          Grails is provided “as is” and “as available.” We make no warranties regarding availability, accuracy,
          reliability, or fitness for a particular purpose.
        </p>
      </div>

      <div className='flex w-full flex-col gap-1'>
        <p className='font-semibold'>5. Limitation of Liability</p>
        <p>
          Use of Grails is at your own risk. To the maximum extent permitted by law, Follow Protocol Foundation shall
          not be liable for:
        </p>
        <ul className='list-inside list-disc'>
          <li>Loss of funds or ENS names</li>
          <li>Failed, delayed, or incorrect transactions</li>
          <li>Smart contract bugs or protocol changes</li>
          <li>Third-party services, wallets, or infrastructure failures</li>
          <li>Any indirect, incidental, or consequential damages</li>
        </ul>
      </div>

      <div className='flex w-full flex-col gap-1'>
        <p className='font-semibold'>6. Third-Party Services</p>
        <p>
          Grails relies on third-party infrastructure and protocols, including Ethereum, ENS, wallet providers, and RPC
          services. We do not control and are not responsible for their operation.
        </p>
      </div>

      <div className='flex w-full flex-col gap-1'>
        <p className='font-semibold'>7. Prohibited Use</p>
        <p>You agree not to:</p>
        <ul className='list-inside list-disc'>
          <li>Use Grails for unlawful purposes</li>
          <li>Attempt to disrupt or exploit the service</li>
          <li>Interfere with other users</li>
          <li>Scrape, abuse, or attack the platform</li>
        </ul>
      </div>

      <div className='flex w-full flex-col gap-1'>
        <p className='font-semibold'>8. Suspension and Termination</p>
        <p>We reserve the absolute right, at our sole discretion, to:</p>
        <ul className='list-inside list-disc'>
          <li>Suspend or terminate access to Grails</li>
          <li>Remove content or data from the interface</li>
          <li>Restrict use for any reason or no reason at all</li>
        </ul>
      </div>

      <div className='flex w-full flex-col gap-1'>
        <p className='font-semibold'>9. Governing Law</p>
        <p>
          These Terms are governed by the laws of the State of Delaware, without regard to conflict-of-law principles.
        </p>
      </div>

      <div className='flex w-full flex-col gap-1'>
        <p className='font-semibold'>10. Dispute Resolution</p>
        <p>
          Any dispute arising out of or relating to Grails or these Terms shall be resolved through binding arbitration,
          except that either party may seek injunctive or equitable relief in court.
        </p>
        <p>You waive the right to participate in class actions or class-wide arbitration.</p>
      </div>

      <div className='flex w-full flex-col gap-1'>
        <p className='font-semibold'>11. Changes to the Terms</p>
        <p>
          We may modify these Terms at any time. Continued use of Grails after changes means you accept the updated
          Terms.
        </p>
      </div>
    </main>
  )
}

export default TermsOfService
