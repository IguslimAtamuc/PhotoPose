import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, History as HistoryIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Segmented } from '@/components/Controls';
import { Skeleton, StateView } from '@/components/Feedback';
import { Sheet } from '@/components/Sheet';
import { TopBar } from '@/components/TopBar';
import { useCatalogStore } from '@/stores/catalogStore';
import { useHistoryStore } from '@/stores/historyStore';
import { toast } from '@/stores/toastStore';
import { formatDate } from '@/utils/format';
import './history.css';

type Sort = 'recent' | 'best';

export default function HistoryScreen() {
  const { sessions, hydrated, clear } = useHistoryStore();
  const byId = useCatalogStore((s) => s.byId);
  const navigate = useNavigate();
  const [sort, setSort] = useState<Sort>('recent');
  const [confirm, setConfirm] = useState(false);
  const list = useMemo(
    () => (sort === 'best' ? [...sessions].sort((a, b) => (b.result?.score ?? -1) - (a.result?.score ?? -1)) : sessions),
    [sessions, sort],
  );
  const analysed = sessions.filter((s) => s.result);
  const avg = analysed.length ? Math.round(analysed.reduce((s, x) => s + (x.result?.score ?? 0), 0) / analysed.length) : 0;
  const best = analysed.reduce((m, x) => Math.max(m, x.result?.score ?? 0), 0);

  return (
    <main className="screen history">
      <TopBar
        title="History"
        large
        back
        right={
          sessions.length > 0 && (
            <button className="text-btn" onClick={() => setConfirm(true)}>
              Clear
            </button>
          )
        }
      />
      {!hydrated ? (
        <div className="page-pad history__list">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="history-row" />)}
        </div>
      ) : sessions.length === 0 ? (
        <StateView
          icon={<HistoryIcon size={28} />}
          title="No photos yet"
          message="Your analysed photos and scores will appear here."
          action={<Button icon={<Camera size={18} />} onClick={() => navigate('/camera')}>Take your first photo</Button>}
        />
      ) : (
        <>
          <div className="stats page-pad">
            <div><strong>{sessions.length}</strong><span>Photos</span></div>
            <div><strong>{avg || '–'}{avg ? '%' : ''}</strong><span>Avg. match</span></div>
            <div><strong>{best || '–'}{best ? '%' : ''}</strong><span>Best</span></div>
          </div>
          <div className="page-pad history__sort">
            <Segmented<Sort> label="Sort" value={sort} onChange={setSort} options={[{ value: 'recent', label: 'Most recent' }, { value: 'best', label: 'Best score' }]} />
          </div>
          <ul className="page-pad history__list">
            {list.map((s) => {
              const pose = byId[s.poseId];
              const score = s.result?.score;
              return (
                <li key={s.id}>
                  <Link to={s.result ? `/session/${s.id}` : `/session/${s.id}/analyze`} className="history-row">
                    <img src={s.thumbnail} alt="" className="history-row__img" loading="lazy" />
                    <div className="history-row__text">
                      <strong>{pose?.title ?? 'Unknown pose'}</strong>
                      <span>{formatDate(s.createdAt)}</span>
                      {!s.result && <span className="history-row__pending">{s.status === 'failed' ? 'Analysis failed · tap to retry' : 'Not analysed yet · tap to analyse'}</span>}
                    </div>
                    {score !== undefined && (
                      <span className={`history-row__score ${score >= 80 ? 'is-good' : score >= 60 ? 'is-ok' : 'is-low'}`} aria-label={`Score ${score} percent`}>
                        {score}%
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <Sheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Clear history?"
        footer={
          <div className="sheet-actions">
            <Button variant="ghost" size="md" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button variant="danger" size="md" icon={<Trash2 size={16} />} onClick={async () => { await clear(); setConfirm(false); toast('History cleared'); }}>
              Delete all
            </Button>
          </div>
        }
      >
        <p className="t-body">All {sessions.length} photos and analyses will be permanently removed from this device.</p>
      </Sheet>
    </main>
  );
}
