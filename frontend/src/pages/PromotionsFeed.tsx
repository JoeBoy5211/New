
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePromotions, Promotion } from '@/hooks/usePromotions';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Play, Pause, ExternalLink, Bookmark, UserPlus, Check, X, Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from '@/components/ui/form';

const commentSchema = z.object({
    comment: z.string().min(1, 'Comment cannot be empty').max(500, 'Comment is too long'),
});

type CommentFormData = z.infer<typeof commentSchema>;

// ----- Comment Panel Component -----
function CommentPanel({
    promotionId,
    isOpen,
    onClose,
    userId,
    onCommentSuccess
}: {
    promotionId: string;
    isOpen: boolean;
    onClose: () => void;
    userId?: string;
    onCommentSuccess?: () => void;
}) {
    const [comments, setComments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();
    const scrollRef = useRef<HTMLDivElement>(null);

    const form = useForm<CommentFormData>({
        resolver: zodResolver(commentSchema),
        defaultValues: {
            comment: '',
        },
    });

    const fetchComments = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.get(`/promotions/${promotionId}/comments`);
            if (data.success) {
                setComments(data.comments || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [promotionId]);

    useEffect(() => {
        if (isOpen) fetchComments();
    }, [isOpen, fetchComments]);

    const onSubmit = async (data: CommentFormData) => {
        if (!userId) return;
        setIsSending(true);
        try {
            const dataRes = await api.post(`/promotions/${promotionId}/comments`, {
                userId,
                comment: data.comment.trim()
            });
            if (dataRes.success && dataRes.comment) {
                setComments(prev => [dataRes.comment, ...prev]);
                form.reset();
                if (onCommentSuccess) onCommentSuccess();
            }
        } catch (e: any) {
            toast({ title: 'Failed to post comment', description: e.message, variant: 'destructive' });
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            form.handleSubmit(onSubmit)();
        }
        // Stop spacebar from toggling video
        e.stopPropagation();
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        const days = Math.floor(hrs / 24);
        return `${days}d`;
    };

    if (!isOpen) return null;

    return (
        <div
            className="absolute inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
        >
            {/* Top spacer / click-to-close area */}
            <div className="flex-1 min-h-[30%]" onClick={onClose} />

            {/* Comment Panel */}
            <div className="bg-zinc-900 rounded-t-2xl flex flex-col max-h-[70%] border-t border-zinc-700">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                    <h3 className="text-white font-bold text-sm">{comments.length} Comments</h3>
                    <Button size="icon" variant="ghost" className="text-white/60 hover:text-white h-8 w-8" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Comments List */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <LoadingSpinner size={24} />
                        </div>
                    ) : comments.length === 0 ? (
                        <p className="text-center text-zinc-500 py-8 text-sm">No comments yet. Be the first!</p>
                    ) : (
                        comments.map((c) => (
                            <div key={c.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden">
                                    {c.user_avatar ? (
                                        <img src={c.user_avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400 font-bold">
                                            {(c.user_name || '?')[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white text-xs font-semibold">{c.user_name || 'User'}</span>
                                        <span className="text-zinc-500 text-[10px]">{timeAgo(c.created_at)}</span>
                                    </div>
                                    <p className="text-zinc-300 text-sm mt-0.5 break-words">{c.comment}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input */}
                <div className="border-t border-zinc-800 px-4 py-3">
                    {userId ? (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2 items-start">
                                <FormField
                                    control={form.control}
                                    name="comment"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    onKeyDown={handleKeyDown}
                                                    placeholder="Add a comment..."
                                                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 text-sm h-9"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[10px] mt-1" />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="h-9 w-9 rounded-full bg-primary hover:bg-primary/80"
                                    disabled={isSending || !form.getValues('comment').trim()}
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </Form>
                    ) : (
                        <p className="text-zinc-500 text-sm text-center w-full py-1">Log in to comment</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ----- Single Feed Item Component -----
function PromotionItem({
    promotion,
    isActive,
    userId,
    onLike,
    onSave,
    onFollow,
    onShare,
    refetch
}: {
    promotion: Promotion,
    isActive: boolean;
    userId?: string;
    onLike: (p: string, u: string) => void;
    onSave: (p: string, u: string) => void;
    onFollow: (c: string, u: string) => void;
    onShare: (p: string) => void;
    refetch: (s?: string, sv?: boolean, bg?: boolean) => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isActive && videoRef.current) {
            videoRef.current.play()
                .then(() => setIsPlaying(true))
                .catch((e) => console.error("Autoplay prevented", e));
        } else if (!isActive && videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
            videoRef.current.currentTime = 0;
        }
    }, [isActive]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't toggle play if comments panel is open
            if (showComments) return;
            if (e.code === 'Space' && isActive) {
                e.preventDefault();
                togglePlay();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, isPlaying, showComments]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const handleShare = async () => {
        onShare(promotion.id);
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Check out ${promotion.caterer_name} on CaterConnect`,
                    text: promotion.caption,
                    url: `${window.location.origin}/caterer/${promotion.caterer_id}`,
                });
            } else {
                await navigator.clipboard.writeText(`${window.location.origin}/caterer/${promotion.caterer_id}`);
                toast({ title: 'Link copied to clipboard!' });
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const getImageUrl = (url: string | null | undefined) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${API_URL}${url}`;
    };

    return (
        <div className="relative h-full w-full snap-start snap-always bg-black flex justify-center items-center">
            {/* Background Media */}
            <div className="absolute inset-0 w-full h-full" onClick={togglePlay}>
                {promotion.media_type === 'video' ? (
                    <video
                        ref={videoRef}
                        src={getImageUrl(promotion.media_url)}
                        className="w-full h-full object-cover"
                        loop
                        playsInline
                        muted={false}
                    />
                ) : (
                    <img
                        src={getImageUrl(promotion.media_url)}
                        className="w-full h-full object-cover"
                        alt={promotion.caption || 'Promotion media'}
                    />
                )}
            </div>

            {/* Overlay Gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80 pointer-events-none" />

            {/* Play/Pause UI */}
            {!isPlaying && promotion.media_type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Play className="w-16 h-16 text-white/50 animate-pulse" fill="currentColor" />
                </div>
            )}

            {/* Content Info (Bottom Left) */}
            <div className="absolute bottom-0 left-0 p-4 pb-20 sm:pb-8 w-4/5 text-white flex flex-col gap-2 z-10">
                <Link to={`/caterer/${promotion.caterer_id}`} className="flex items-center gap-2 mb-1 group max-w-fit">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/80 group-hover:border-primary transition-colors">
                        <img src={getImageUrl(promotion.caterer_image)} alt={promotion.caterer_name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors leading-tight flex items-center gap-2">
                            @{promotion.caterer_name}

                            {/* Follow Button inline */}
                            {(!userId || !promotion.is_following) && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 text-xs px-3 py-0 border-amber-800 bg-amber-800 text-white hover:bg-amber-900 rounded-full backdrop-blur-md transition-colors"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (!userId) toast({ title: 'Please log in to follow' });
                                        else onFollow(promotion.caterer_id, userId);
                                    }}
                                >
                                    Follow
                                </Button>
                            )}
                        </h3>
                        <p className="text-xs text-white/60 mt-0.5">{promotion.followers_count || 0} followers</p>
                    </div>
                </Link>
                <p className="text-sm line-clamp-3 md:line-clamp-none text-white/90 drop-shadow-md">
                    {promotion.caption}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                    {promotion.tags?.split(',').map((tag, i) => (
                        <span key={i} className="text-xs font-semibold text-primary drop-shadow">
                            #{tag.trim()}
                        </span>
                    ))}
                </div>
            </div>

            {/* Actions Side (Bottom Right) */}
            <div className="absolute bottom-24 right-2 sm:bottom-12 sm:right-4 flex flex-col items-center gap-4 z-10">
                {/* Like Button */}
                <div className="group flex flex-col items-center">
                    <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                            "w-10 h-10 md:w-12 md:h-12 rounded-full backdrop-blur-sm transition-all shadow-lg",
                            promotion.is_liked ? "bg-black/30 hover:bg-red-500/30 text-red-500" : "bg-black/30 hover:bg-black/50 text-white"
                        )}
                        onClick={() => {
                            if (!userId) {
                                toast({ title: "Please log in to like videos" });
                                return;
                            }
                            onLike(promotion.id, userId);
                        }}
                    >
                        <Heart className={cn("w-6 h-6", promotion.is_liked && "fill-current")} />
                    </Button>
                    <span className="text-xs text-white drop-shadow font-bold mt-1 shadow-black">{promotion.likes_count || 0}</span>
                </div>

                {/* Comment Button */}
                <div className="group flex flex-col items-center">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm shadow-lg"
                        onClick={() => setShowComments(true)}
                    >
                        <MessageCircle className="w-5 h-5" />
                    </Button>
                    <span className="text-xs text-white drop-shadow font-semibold mt-1 shadow-black">{promotion.comments_count || 0}</span>
                </div>

                {/* Save Button */}
                <div className="group flex flex-col items-center">
                    <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                            "w-10 h-10 md:w-12 md:h-12 rounded-full backdrop-blur-sm transition-all shadow-lg",
                            promotion.is_saved ? "bg-black/30 hover:bg-yellow-500/30 text-yellow-500" : "bg-black/30 hover:bg-black/50 text-white"
                        )}
                        onClick={() => {
                            if (!userId) {
                                toast({ title: "Please log in to save videos" });
                                return;
                            }
                            onSave(promotion.id, userId);
                        }}
                    >
                        <Bookmark className={cn("w-5 h-5", promotion.is_saved && "fill-current")} />
                    </Button>
                    <span className="text-xs text-white drop-shadow font-semibold mt-1 shadow-black">Save</span>
                </div>

                {/* Share Button */}
                <div className="group flex flex-col items-center">
                    <Button size="icon" variant="ghost" className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm shadow-lg" onClick={handleShare}>
                        <Share2 className="w-5 h-5" />
                    </Button>
                    <span className="text-xs text-white drop-shadow font-semibold mt-1 shadow-black">{promotion.shares_count || 0}</span>
                </div>

                {/* Caterer Profile Button */}
                <div className="group flex flex-col items-center mt-1">
                    <Button size="icon" variant="ghost" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white/30 bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm overflow-hidden" asChild>
                        <Link to={`/caterer/${promotion.caterer_id}`}>
                            <img src={getImageUrl(promotion.caterer_image)} className="w-full h-full object-cover" />
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Comment Panel Overlay */}
            <CommentPanel
                promotionId={promotion.id}
                isOpen={showComments}
                onClose={() => setShowComments(false)}
                userId={userId}
                onCommentSuccess={() => refetch(undefined, undefined, true)}
            />
        </div>
    );
}

export default function PromotionsFeed() {
    const { promotions, isLoading, toggleLike, toggleSave, toggleFollow, trackShare, refetch } = usePromotions();
    const { user } = useAuth();
    const [activeIndex, setActiveIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'discovery' | 'saved' | 'following'>('discovery');
    const containerRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Handle search submission
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        refetch(searchTerm, activeTab === 'saved', false, activeTab === 'following');
    };

    // Auto-search or tab change
    useEffect(() => {
        refetch(searchTerm, activeTab === 'saved', false, activeTab === 'following');
    }, [activeTab]);

    useEffect(() => {
        if (searchTerm === '') {
            refetch('', activeTab === 'saved', false, activeTab === 'following');
        }
    }, [searchTerm]);

    // Handle keyboard navigation (ArrowUp / ArrowDown)
    useEffect(() => {
        const handleKeyDownGrid = (e: KeyboardEvent) => {
            if (!containerRef.current || promotions.length === 0) return;

            const clientHeight = containerRef.current.clientHeight;

            if (e.key === 'ArrowDown') {
                if (activeIndex < promotions.length - 1) {
                    e.preventDefault();
                    const newIndex = activeIndex + 1;
                    containerRef.current.scrollTo({
                        top: newIndex * clientHeight,
                        behavior: 'smooth'
                    });
                    setActiveIndex(newIndex);
                }
            } else if (e.key === 'ArrowUp') {
                if (activeIndex > 0) {
                    e.preventDefault();
                    const newIndex = activeIndex - 1;
                    containerRef.current.scrollTo({
                        top: newIndex * clientHeight,
                        behavior: 'smooth'
                    });
                    setActiveIndex(newIndex);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDownGrid);
        return () => window.removeEventListener('keydown', handleKeyDownGrid);
    }, [activeIndex, promotions.length]);

    // Use intersection observer or simple scroll listener to determine active index
    const handleScroll = () => {
        if (!containerRef.current) return;
        const { scrollTop, clientHeight } = containerRef.current;

        // Calculate which item is currently taking the majority of the view
        const index = Math.round(scrollTop / clientHeight);

        if (index !== activeIndex && index >= 0 && index < promotions.length) {
            setActiveIndex(index);
        }
    };

    if (isLoading) {
        return (
            <MainLayout hideFooter>
                <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                    <LoadingSpinner size={40} text="Loading discoveries..." />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout hideFooter>
            <div className="flex justify-center w-full bg-zinc-950 h-[calc(100vh-4rem)] overflow-hidden relative">
                {/* Search Bar & Tabs - Floating at top */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-[480px] px-4 flex flex-col gap-3">
                    {/* Tabs */}
                    <div className="flex justify-center items-center p-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 w-fit mx-auto shadow-lg overflow-x-auto no-scrollbar max-w-full">
                        <button
                            onClick={() => setActiveTab('discovery')}
                            className={cn(
                                "px-5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                                activeTab === 'discovery' ? "bg-white text-black shadow-md" : "text-white/60 hover:text-white"
                            )}
                        >
                            Discovery
                        </button>
                        <button
                            onClick={() => {
                                if (!user) toast({ title: "Log in to see following videos" });
                                else setActiveTab('following');
                            }}
                            className={cn(
                                "px-5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                                activeTab === 'following' ? "bg-white text-black shadow-md" : "text-white/60 hover:text-white"
                            )}
                        >
                            Following
                        </button>
                        <button
                            onClick={() => {
                                if (!user) toast({ title: "Log in to see saved videos" });
                                else setActiveTab('saved');
                            }}
                            className={cn(
                                "px-5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                                activeTab === 'saved' ? "bg-white text-black shadow-md" : "text-white/60 hover:text-white"
                            )}
                        >
                            Saved
                        </button>
                    </div>

                    <form onSubmit={handleSearch} className="relative group w-full max-w-[380px] mx-auto">
                        <Input
                            placeholder={
                                activeTab === 'discovery' ? "Search hashtags or caterers..." :
                                    activeTab === 'following' ? "Search following..." : "Search saved..."
                            }
                            className="bg-black/40 border-white/20 text-white placeholder:text-white/40 h-10 pl-4 pr-10 rounded-full backdrop-blur-md focus:bg-black/60 transition-all focus:border-primary/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            variant="ghost"
                            className="absolute right-1 top-1 h-8 w-8 text-white/60 hover:text-white hover:bg-transparent"
                        >
                            <Play className="w-4 h-4 rotate-90" />
                        </Button>
                    </form>
                </div>

                {/* Mobile-sized snap scrolling container restricted to max-w-md */}
                <div
                    className="h-full w-full max-w-[420px] relative overflow-y-scroll snap-y snap-mandatory bg-black scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shadow-2xl"
                    ref={containerRef}
                    onScroll={handleScroll}
                >
                    {!isLoading && promotions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-zinc-950">
                            {searchTerm || activeTab !== 'discovery' ? (
                                <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                                    <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-2 border border-zinc-800">
                                        <X className="w-10 h-10 text-zinc-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">
                                        {activeTab === 'saved' && !searchTerm ? "No saved videos yet" :
                                            activeTab === 'following' && !searchTerm ? "Follow caterers to see their feed" :
                                                `No results for "${searchTerm}"`}
                                    </h3>
                                    <p className="text-zinc-500 text-sm max-w-[250px] mx-auto">
                                        {activeTab === 'saved' && !searchTerm
                                            ? "Explore the discovery feed and tap the bookmark icon to save videos for later."
                                            : activeTab === 'following' && !searchTerm
                                                ? "You don't follow any caterers yet. Start exploring and following your favorites."
                                                : "We couldn't find any promotions matching your search."}
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="mt-4 border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-full font-bold px-6"
                                        onClick={() => {
                                            if (searchTerm) {
                                                setSearchTerm('');
                                                refetch('', activeTab === 'saved', false, activeTab === 'following');
                                            } else {
                                                setActiveTab('discovery');
                                            }
                                        }}
                                    >
                                        {searchTerm ? "Clear search" : "Go to Discovery"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in duration-500">
                                    <h2 className="text-3xl font-display font-bold text-white">No content yet!</h2>
                                    <p className="text-zinc-500 max-w-[280px] mx-auto">
                                        Our caterers are working on creating some amazing promotional videos and images.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        promotions.map((promotion, index) => (
                            <PromotionItem
                                key={promotion.id}
                                promotion={promotion}
                                isActive={index === activeIndex}
                                userId={user?.id}
                                onLike={toggleLike}
                                onSave={toggleSave}
                                onFollow={toggleFollow}
                                onShare={trackShare}
                                refetch={refetch}
                            />
                        ))
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
