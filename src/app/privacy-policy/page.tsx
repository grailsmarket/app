const PrivacyPolicy = () => {
  return (
    <main className='mx-auto flex max-w-4xl flex-col items-center gap-6 py-8 font-medium'>
      <h1 className='text-4xl font-bold'>Privacy Policy</h1>

      <div className='flex w-full flex-col gap-1'>
        <p className='font-semibold'>1. Who We Are</p>
        <p>
          Grails is operated by Follow Protocol Foundation, a Delaware entity in the United States (“we,” “us,” or
          “our”).
        </p>
        <p>
          Grails is a web-based interface that allows users to discover, manage, and interact with Ethereum Name Service
          (“ENS”) names, among other things.
        </p>
      </div>

      <div className='flex w-full flex-col gap-1'>
        <p className='font-semibold'>2. Information We Collect</p>
        <p>We may collect the following categories of information:</p>
        <ul className='list-inside list-disc'>
          <li>Blockchain and Technical Information</li>
          <li>Wallet addresses</li>
          <li>ENS names and related on-chain data</li>
          <li>IP addresses</li>
          <li>Browser type, device information, and user agent data</li>
          <li>Server logs and error logs</li>
          <li>User-Provided Information</li>
          <li>Email addresses (if you choose to provide one)</li>
          <li>Messages or information you submit through contact or support features</li>
          <li>Basic profile or preference data (such as watchlists or saved items)</li>
          <li>Other settings, profile data, messages, or comments on the webapp</li>
          <li>Usage and Analytics Information</li>
          <li>Analytics data related to how users interact with the Grails website</li>
          <li>Cookies, local storage, or similar technologies used for functionality, analytics, and performance</li>
        </ul>
      </div>

      <div className='flex w-full flex-col gap-1'>
        <p className='font-semibold'>3. How We Use Information</p>
        <p>We use collected information to:</p>
        <ul className='list-inside list-disc'>
          <li>Provide and operate the Grails service</li>
          <li>Enable ENS name discovery, management, and market functionality</li>
          <li>Improve performance, reliability, and security</li>
          <li>Monitor and prevent abuse, fraud, or unlawful activity</li>
          <li>Communicate with users who choose to provide contact information</li>
        </ul>
      </div>

      <div className='flex w-full flex-col gap-1'>
        <p className='font-semibold'>4. Blockchain Data</p>
        <p>
          Blockchain transactions and ENS data are public by nature and not controlled by us. Information recorded on
          public blockchains may be permanently accessible and cannot be modified or deleted by Grails.
        </p>
      </div>

      <div className='flex w-full flex-col gap-1'>
        <p className='font-semibold'>5. Sharing of Information</p>
        <p>We may share information:</p>
        <ul className='list-inside list-disc'>
          <li>With infrastructure, analytics, or service providers who help operate Grails</li>
          <li>To comply with legal obligations or lawful requests</li>
          <li>To protect the rights, safety, or security of Grails, our users, or others</li>
          <li>If our data practices change in the future, this Privacy Policy will be updated accordingly</li>
        </ul>
      </div>

      <div className='flex w-full flex-col gap-1'>
        <p className='font-semibold'>6. Data Retention</p>
        <p>
          We retain off-chain information to operate the service, comply with legal obligations, and enforce our
          policies.
        </p>
      </div>

      <div className='flex w-full flex-col gap-1'>
        <p className='font-semibold'>7. Children&quot;s Privacy</p>
        <p>
          Grails is not intended for children under the age of 13, and we do not knowingly collect personal information
          from children.
        </p>
      </div>

      <div className='flex w-full flex-col gap-1'>
        <p className='font-semibold'>8. Your Rights</p>
        <p>
          Depending on your location, you may have rights to request access to or deletion of certain off-chain personal
          data we hold about you.
        </p>
      </div>

      <div className='flex w-full flex-col gap-1'>
        <p className='font-semibold'>9. Contact</p>
        <p>For privacy-related inquiries, contact: contact@ethfollow.xyz.</p>
      </div>

      <div className='flex w-full flex-col gap-1'>
        <p className='font-semibold'>10. Changes to This Policy</p>
        <p>
          We may update this Privacy Policy from time to time. Updates will be posted on this page with a revised “Last
          updated” date.
        </p>
      </div>
    </main>
  )
}

export default PrivacyPolicy
