import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, shadow } from '@/theme/colors';
import { useLanguage } from '@/i18n/LanguageContext';
import { AppIcon } from './AppIcons';
import { useCreateReview, useUpdateReview } from '@/hooks/useReviews';
import type { ReviewWithCustomer } from '@/types/domain';

const MAX_COMMENT = 500;

export function StarInput({
  value,
  onChange,
  size = 36,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const { t } = useLanguage();
  return (
    <View style={s.stars} accessibilityRole="radiogroup" accessibilityLabel={t('review.selectRating')}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        return (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            hitSlop={8}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === star }}
            accessibilityLabel={star === 1 ? t('review.starOne', { n: star }) : t('review.starMany', { n: star })}
            style={({ pressed }) => pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] }}
          >
            <AppIcon
              name="star"
              size={size}
              color={active ? colors.starGold : colors.border}
              filled
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export function ReviewModal({
  visible,
  onClose,
  catererId,
  catererName,
  customerId,
  bookingId,
  existing,
  onSubmitted,
}: {
  visible: boolean;
  onClose: () => void;
  catererId: string;
  catererName: string;
  customerId: string | undefined;
  bookingId?: string | null;
  existing?: ReviewWithCustomer | null;
  onSubmitted?: () => void;
}) {
  const isEditing = !!existing;
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? '');
  const [error, setError] = useState<string | null>(null);

  const create = useCreateReview(catererId);
  const update = useUpdateReview(catererId);
  const pending = create.isPending || update.isPending;
  const { t } = useLanguage();
  const ratingLabels = ['', t('review.rPoor'), t('review.rFair'), t('review.rGood'), t('review.rVeryGood'), t('review.rExcellent')];

  useEffect(() => {
    if (visible) {
      setRating(existing?.rating ?? 0);
      setComment(existing?.comment ?? '');
      setError(null);
      create.reset();
      update.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, existing?.id]);

  const submit = () => {
    if (!customerId) {
      setError(t('review.signinErr'));
      return;
    }
    if (!rating || rating < 1 || rating > 5) {
      setError(t('review.starErr'));
      return;
    }
    setError(null);
    const trimmed = comment.trim() ? comment.trim() : null;
    if (isEditing && existing) {
      update.mutate(
        { reviewId: existing.id, rating, comment: trimmed },
        {
          onSuccess: () => {
            onSubmitted?.();
            onClose();
          },
          onError: (e) => setError(e instanceof Error ? e.message : t('review.updateFail')),
        },
      );
    } else {
      create.mutate(
        { customer_id: customerId, caterer_id: catererId, booking_id: bookingId ?? null, rating, comment: trimmed },
        {
          onSuccess: () => {
            onSubmitted?.();
            onClose();
          },
          onError: (e) => setError(e instanceof Error ? e.message : t('review.submitFail')),
        },
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.flex}
      >
        <Pressable style={s.overlay} onPress={onClose}>
          <Pressable style={s.card} onPress={() => undefined}>
            <View style={s.handle} />
            <View style={s.head}>
              <View style={s.headText}>
                <Text style={s.kicker}>{isEditing ? t('review.editTitle') : t('review.rateTitle')}</Text>
                <Text style={s.title} numberOfLines={1}>
                  {catererName}
                </Text>
                <Text style={s.sub}>
                  {isEditing ? t('review.editSub') : t('review.rateSub')}
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={10} accessibilityLabel={t('review.closeForm')} style={s.closeBtn}>
                <Text style={s.closeText}>✕</Text>
              </Pressable>
            </View>

            <StarInput value={rating} onChange={(v) => { setRating(v); setError(null); }} />
            <Text style={[s.ratingLabel, !rating && s.ratingPlaceholder]}>
              {rating ? ratingLabels[rating] : t('review.tapToRate')}
            </Text>

            <Text style={s.fieldLabel}>{t('review.fieldLabel')} <Text style={s.optional}>{t('review.optional')}</Text></Text>
            <TextInput
              value={comment}
              onChangeText={(t) => setComment(t.slice(0, MAX_COMMENT))}
              placeholder={t('review.placeholder')}
              placeholderTextColor={colors.textFaint}
              multiline
              numberOfLines={4}
              maxLength={MAX_COMMENT}
              textAlignVertical="top"
              editable={!pending}
              style={s.input}
            />
            <Text style={s.count}>{comment.length}/{MAX_COMMENT}</Text>

            {error ? <Text style={s.error}>{error}</Text> : null}

            <Pressable
              onPress={submit}
              disabled={pending || !rating}
              accessibilityRole="button"
              accessibilityLabel={isEditing ? t('review.saveLabel') : t('review.submitLabel')}
              style={({ pressed }) => [
                s.submit,
                (!rating || pending) && s.submitDisabled,
                pressed && rating && !pending ? { opacity: 0.88 } : null,
              ]}
            >
              {pending ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <AppIcon name="star" size={18} color={colors.white} filled />
                  <Text style={s.submitText}>{isEditing ? t('review.save') : t('review.submit')}</Text>
                </>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginVertical: 8 },
  head: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 },
  headText: { flex: 1 },
  kicker: { fontSize: 12, fontWeight: '700', color: colors.primaryDark, letterSpacing: 0.6, textTransform: 'uppercase' },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3, marginTop: 2 },
  sub: { fontSize: 13.5, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F1F2F4', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  closeText: { fontSize: 15, color: colors.textMuted, fontWeight: '700' },
  stars: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18 },
  ratingLabel: { textAlign: 'center', fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 8 },
  ratingPlaceholder: { color: colors.textFaint, fontWeight: '600' },
  fieldLabel: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 18 },
  optional: { fontWeight: '500', color: colors.textFaint, fontSize: 13 },
  input: {
    minHeight: 104,
    maxHeight: 160,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: '#FCFCF9',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14.5,
    color: colors.text,
    lineHeight: 20,
    marginTop: 8,
  },
  count: { textAlign: 'right', fontSize: 11.5, color: colors.textFaint, marginTop: 4 },
  error: { fontSize: 13, fontWeight: '600', color: colors.danger, backgroundColor: colors.dangerBg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginTop: 10, overflow: 'hidden' },
  submit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 15,
    marginTop: 14,
  },
  submitDisabled: { opacity: 0.45 },
  submitText: { color: colors.white, fontWeight: '800', fontSize: 16, marginLeft: 8 },
});
