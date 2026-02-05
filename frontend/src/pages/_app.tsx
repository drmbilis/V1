import '../styles/globals.css'; // @/styles yerine ../styles
import type { AppProps } from 'next/app';
import Layout from '../components/Layout'; // @/components yerine ../components
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Ana sayfada (Login) Layout görünmesin
  const isLoginPage = router.pathname === '/';

  if (isLoginPage) {
    return <Component {...pageProps} />;
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}