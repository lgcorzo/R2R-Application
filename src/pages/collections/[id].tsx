import { useRouter } from 'next/router';
import { useEffect } from 'react';

import Layout from '@/components/Layout';

const CollectionRedirect: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const { id } = router.query;
    if (typeof id === 'string') {
      router.replace(`/explorer?collection=${id}&tab=documents`);
    }
  }, [router.isReady, router.query.id, router]);

  return (
    <Layout pageTitle="Redirecting..." includeFooter={false}>
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)] justify-center items-center">
        <p>Redirecting to Explorer...</p>
      </main>
    </Layout>
  );
};

export default CollectionRedirect;
