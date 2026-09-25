import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/Button';
import { StateView } from '@/components/Feedback';

export default function NotFoundScreen() {
  const navigate = useNavigate();
  return (
    <main className="screen screen--no-tabs">
      <StateView icon={<Compass size={28} />} title="Page not found" message="That screen doesn’t exist." action={<Button onClick={() => navigate('/')}>Go home</Button>} />
    </main>
  );
}
