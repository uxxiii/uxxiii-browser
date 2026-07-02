import { useState, useRef, useEffect, useCallback } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import {

  ArrowLeft, ArrowRight, RotateCw, X, Home, Lock, Search,

  Star, Globe, Loader2,

} from 'lucide-react';

import { cn, debounce } from '../../lib/utils';

import { useTabStore } from '../../stores/tabStore';

import { useNavigationStore } from '../../stores/navigationStore';

import { isInternalUrl } from '@shared/types';

import { isSecureUrl } from '../../lib/utils';



export function AddressBar() {

  const activeTab = useTabStore((s) => s.getActiveTab());

  const activeTabId = useTabStore((s) => s.activeTabId);

  const {

    addressBarValue, setAddressBarValue, suggestions, showSuggestions,

    setShowSuggestions, fetchSuggestions, setAddressBarFocused,

  } = useNavigationStore();



  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedIndex, setSelectedIndex] = useState(-1);



  useEffect(() => {

    if (activeTab) {

      setAddressBarValue(isInternalUrl(activeTab.url) ? '' : activeTab.url);

    }

  }, [activeTab?.id, activeTab?.url]);



  const debouncedFetch = useCallback(

    debounce((query: unknown) => {

      if (typeof query === 'string') {

        void fetchSuggestions(query);

      }

    }, 200),

    [fetchSuggestions]

  );



  const handleChange = (value: string) => {

    setAddressBarValue(value);

    debouncedFetch(value);

    setSelectedIndex(-1);

  };



  const navigate = (url: string) => {

    if (!activeTabId) return;

    window.uxxxiii.nav.go(activeTabId, url);

    setShowSuggestions(false);

    inputRef.current?.blur();

  };



  const handleSubmit = (e: React.FormEvent) => {

    e.preventDefault();

    if (selectedIndex >= 0 && suggestions[selectedIndex]) {

      const s = suggestions[selectedIndex];

      navigate(s.url || s.text);

    } else {

      navigate(addressBarValue);

    }

  };



  const handleKeyDown = (e: React.KeyboardEvent) => {

    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {

      e.preventDefault();

      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));

    } else if (e.key === 'ArrowUp') {

      e.preventDefault();

      setSelectedIndex((i) => Math.max(i - 1, -1));

    } else if (e.key === 'Escape') {

      setShowSuggestions(false);

    }

  };



  const isInternal = activeTab && isInternalUrl(activeTab.url);

  const isSecure = activeTab && !isInternal && isSecureUrl(activeTab.url);

  const showInsecure = activeTab && !isInternal && activeTab.url && !isSecureUrl(activeTab.url);



  return (

    <div className="relative flex items-center gap-1 px-0 h-12 bg-surface border-b border-border-subtle chrome-ui">

      {activeTab?.isLoading && (

        <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden">

          <div className="tab-loading-bar h-full w-1/3 bg-accent rounded-full" />

        </div>

      )}



      <div className="flex items-center gap-0.5 no-drag">

        <NavButton

          icon={<ArrowLeft size={16} />}

          disabled={!activeTab?.canGoBack || !!isInternal}

          onClick={() => activeTabId && window.uxxxiii.nav.back(activeTabId)}

          title="Back"

        />

        <NavButton

          icon={<ArrowRight size={16} />}

          disabled={!activeTab?.canGoForward || !!isInternal}

          onClick={() => activeTabId && window.uxxxiii.nav.forward(activeTabId)}

          title="Forward"

        />

        <NavButton

          icon={activeTab?.isLoading ? <X size={16} /> : <RotateCw size={16} className={activeTab?.isLoading ? 'animate-spin' : ''} />}

          onClick={() => {

            if (!activeTabId) return;

            activeTab?.isLoading

              ? window.uxxxiii.nav.stop(activeTabId)

              : window.uxxxiii.nav.reload(activeTabId);

          }}

          title={activeTab?.isLoading ? 'Stop' : 'Reload'}

        />

        <NavButton

          icon={<Home size={16} />}

          onClick={() => activeTabId && window.uxxxiii.nav.home(activeTabId)}

          title="Home"

        />

      </div>



      <form onSubmit={handleSubmit} className="flex-1 relative no-drag">

        <div className={cn(

          'flex items-center gap-2 px-4 h-9 rounded-xl transition-all',

          'bg-surface-tertiary border border-transparent',

          'focus-within:border-accent/40 focus-within:bg-surface-elevated focus-within:shadow-glow'

        )}>

          {isInternal ? (

            <Search size={14} className="text-text-tertiary shrink-0" />

          ) : activeTab?.isLoading ? (

            <Loader2 size={14} className="text-accent shrink-0 animate-spin" />

          ) : isSecure ? (

            <Lock size={14} className="text-green-500 shrink-0" />

          ) : showInsecure ? (

            <Globe size={14} className="text-text-tertiary shrink-0" />

          ) : (

            <Search size={14} className="text-text-tertiary shrink-0" />

          )}



          <input

            ref={inputRef}

            data-address-bar

            type="text"

            value={addressBarValue}

            onChange={(e) => handleChange(e.target.value)}

            onFocus={() => {

              setAddressBarFocused(true);

              if (addressBarValue) debouncedFetch(addressBarValue);

            }}

            onBlur={() => {

              setTimeout(() => {

                setAddressBarFocused(false);

                setShowSuggestions(false);

              }, 200);

            }}

            onKeyDown={handleKeyDown}

            placeholder={isInternal ? 'Search or enter address' : 'Search or enter address'}

            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"

          />



          {activeTab && !isInternalUrl(activeTab.url) && (

            <button

              type="button"

              onClick={() => {

                window.uxxxiii.bookmarks.add({

                  title: activeTab.title,

                  url: activeTab.url,

                  favicon: activeTab.favicon,

                  workspaceId: activeTab.workspaceId,
                });

              }}

              className="shrink-0 p-1 rounded hover:bg-surface-tertiary transition-colors"

              title="Bookmark this page"

            >

              <Star size={14} className="text-text-tertiary hover:text-yellow-400" />

            </button>

          )}

        </div>



        <AnimatePresence>

          {showSuggestions && suggestions.length > 0 && (

            <motion.div

              initial={{ opacity: 0, y: -4 }}

              animate={{ opacity: 1, y: 0 }}

              exit={{ opacity: 0, y: -4 }}

              className="absolute top-full left-0 right-0 mt-1 py-1 bg-surface-elevated border border-border rounded-xl shadow-elevated z-50 overflow-hidden"

            >

              {suggestions.map((s, i) => (

                <button

                  key={`${s.type}-${s.text}-${i}`}

                  type="button"

                  onMouseDown={() => navigate(s.url || s.text)}

                  className={cn(

                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',

                    i === selectedIndex ? 'bg-accent-muted' : 'hover:bg-surface-tertiary'

                  )}

                >

                  {s.type === 'history' ? (

                    <RotateCw size={14} className="text-text-tertiary shrink-0" />

                  ) : s.type === 'bookmark' ? (

                    <Star size={14} className="text-yellow-400 shrink-0" />

                  ) : (

                    <Search size={14} className="text-text-tertiary shrink-0" />

                  )}

                  <div className="flex-1 min-w-0">

                    <div className="text-sm text-text-primary truncate">{s.text}</div>

                    {s.url && (

                      <div className="text-xs text-text-tertiary truncate">{s.url}</div>

                    )}

                  </div>

                  <span className="text-[10px] text-text-tertiary uppercase">{s.type}</span>

                </button>

              ))}

            </motion.div>

          )}

        </AnimatePresence>

      </form>

    </div>

  );

}



function NavButton({

  icon, onClick, disabled, title,

}: {

  icon: React.ReactNode;

  onClick?: () => void;

  disabled?: boolean;

  title?: string;

}) {

  return (

    <button

      onClick={onClick}

      disabled={disabled}

      title={title}

      className={cn(

        'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',

        disabled

          ? 'text-text-tertiary/40 cursor-not-allowed'

          : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'

      )}

    >

      {icon}

    </button>

  );

}

