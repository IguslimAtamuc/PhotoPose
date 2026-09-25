import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { IconButton } from './Button';

interface Props {
  title?: string;
  back?: boolean | string;
  right?: ReactNode;
  overlay?: boolean;
  large?: boolean;
}

/** Navigation bar. `back` = true goes back in history, string = explicit route. */
export function TopBar({ title, back, right, overlay, large }: Props) {
  const navigate = useNavigate();
  const goBack = () => {
    if (typeof back === 'string') navigate(back);
    else if (window.history.state && window.history.state.idx > 0) navigate(-1);
    else navigate('/');
  };
  return (
    <header className={`topbar ${overlay ? 'topbar--overlay' : ''}`}>
      <div className="topbar__side">
        {back && (
          <IconButton label="Back" variant={overlay ? 'glass' : 'plain'} onClick={goBack}>
            <ChevronLeft size={24} />
          </IconButton>
        )}
      </div>
      {title && !large ? <h1 className="topbar__title">{title}</h1> : <span aria-hidden />}
      <div className="topbar__side topbar__side--right">{right}</div>
      {title && large && <h1 className="topbar__large t-title">{title}</h1>}
    </header>
  );
}
