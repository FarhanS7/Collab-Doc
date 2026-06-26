import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import EditorComponent from '@/components/editor/EditorComponent';
import Link from 'next/link';



async function getDocument(id: string, reqHeaders: Headers) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/docs/${id}`, {
    headers: {
      Cookie: reqHeaders.get('cookie') || '',
    },
    cache: 'no-store', // Always fresh for editor
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    if (res.status === 403) throw new Error('FORBIDDEN');
    throw new Error('FAILED_TO_FETCH');
  }

  const json = await res.json();
  return json.data;
}

export default async function DocumentPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/login?callbackUrl=/doc/${params.id}`);
  }

  // We need the headers to forward the auth cookie to our own API
  const { headers } = await import('next/headers');
  const reqHeaders = headers();

  let doc;
  try {
    doc = await getDocument(params.id, reqHeaders);
  } catch (err: any) {
    if (err.message === 'FORBIDDEN') {
      return (
        <div className="doc-error-page">
          <div className="doc-error-box">
            <h1>Access Denied</h1>
            <p>You do not have permission to view this document.</p>
            <Link href="/dashboard" className="doc-btn">Return to Dashboard</Link>
          </div>
        </div>
      );
    }
    return <div className="doc-error-page">Failed to load document</div>;
  }

  if (!doc) {
    notFound();
  }

  return (
    <EditorComponent 
      documentId={doc.id} 
      title={doc.title}
      initialYDocBase64={doc.yDocState} 
      role={doc.currentUserRole} 
      userId={(session.user as any).id}
      userName={session.user.name || 'Anonymous'}
      initialMembers={doc.members}
    />
  );
}
