// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  // Instantly route users to the playground when they hit the root URL
  redirect('/playground');
}