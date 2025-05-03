# Transaction Performance Test with Privy

This application demonstrates how to measure blockchain transaction performance when using Privy embedded wallets. It tracks and displays metrics about transaction submission and confirmation times.

## Features

- Login with Privy's embedded wallet
- Transaction performance tracking
- Real-time visualization of transaction progress
- Statistics compilation across multiple transactions

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file with your Privy App ID:
   ```
   NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
   ```
4. Update the contract details in `src/constants/contracts.ts` with your own contract address and ABI
5. Start the development server:
   ```
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) in your browser

## How it Works

This app measures three key transaction events:

1. **Click** - User initiates the transaction
2. **Submission** - Transaction is submitted to the blockchain
3. **Receipt** - Transaction is confirmed and receipt is received

The app displays both the time from click to each event and the time between events.

## Technologies Used

- Next.js
- React
- Privy for wallet management
- shadcn/ui for the component library

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
