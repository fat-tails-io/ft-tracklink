import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';
import type { GetIssueTrackContextResponse, TrackLinkEntry } from '../../types';

export type UseIssueTrackContextOptions = {
  issueKey?: string;
};

export const useIssueTrackContext = (
  options: UseIssueTrackContextOptions,
): {
  loading: boolean;
  summary: string;
  links: TrackLinkEntry[];
  linkCount: number;
  maxLinks: number;
  canAddLink: boolean;
  selectedLinkId: string | undefined;
  setSelectedLinkId: (linkId: string | undefined) => void;
  refresh: () => Promise<void>;
} => {
  const { issueKey } = options;
  const [loading, setLoading] = useState(Boolean(issueKey));
  const [summary, setSummary] = useState('');
  const [links, setLinks] = useState<TrackLinkEntry[]>([]);
  const [linkCount, setLinkCount] = useState(0);
  const [maxLinks, setMaxLinks] = useState(10);
  const [canAddLink, setCanAddLink] = useState(true);
  const [selectedLinkId, setSelectedLinkId] = useState<string | undefined>();

  const refresh = useCallback(async (): Promise<void> => {
    if (!issueKey) {
      setLoading(false);
      setSummary('');
      setLinks([]);
      setLinkCount(0);
      setCanAddLink(false);
      return;
    }

    setLoading(true);
    try {
      const ctx = await invoke<GetIssueTrackContextResponse>('getIssueTrackContext', {
        issueKey,
      });
      setSummary(ctx.summary);
      setLinks(ctx.links);
      setLinkCount(ctx.linkCount);
      setMaxLinks(ctx.maxLinks);
      setCanAddLink(ctx.canAddLink);
      setSelectedLinkId((prev) => {
        if (prev && ctx.links.some((l) => l.linkId === prev)) {
          return prev;
        }
        return ctx.links[ctx.links.length - 1]?.linkId;
      });
    } catch (error) {
      console.error('Failed to load issue track context:', error);
      setSummary('');
      setLinks([]);
      setLinkCount(0);
      setCanAddLink(true);
    } finally {
      setLoading(false);
    }
  }, [issueKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    loading,
    summary,
    links,
    linkCount,
    maxLinks,
    canAddLink,
    selectedLinkId,
    setSelectedLinkId,
    refresh,
  };
};
