'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link,
} from '@react-pdf/renderer';
import type { ProtocolResult, Sport, EventType, GIFrequency, Gender } from '@/lib/types';

// Colors - matching Tailwind classes exactly
const colors = {
  black: '#111111',
  white: '#ffffff',
  // Border colors - light grey for all borders
  borderLightGrey: 'rgba(0, 0, 0, 0.05)', // light grey for borders and dividers
  // Background colors
  bgBlack5: 'rgba(0, 0, 0, 0.05)', // bg-black/5
  bgBlack3: 'rgba(0, 0, 0, 0.03)', // bg-black/3
  bgLight: '#f7f7f7', // section-light background
  bgSessionCard: '#f5f5f5', // light/bright grey for session cards
  // Text colors
  textBlack: '#111111', // text-black
  textBlack70: 'rgba(17, 17, 17, 0.7)', // text-black/70
  textBlack60: 'rgba(17, 17, 17, 0.6)', // text-black/60
  textBlack50: 'rgba(17, 17, 17, 0.5)', // text-black/50
};

// Styles - optimized for single-page with matching browser colors
const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  // Hero section
  heroSection: {
    textAlign: 'center',
    paddingBottom: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 500,
    color: colors.textBlack,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 7,
    color: colors.textBlack50,
  },
  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgSessionCard,
    borderRadius: 12,
    padding: 10,
    textAlign: 'center',
  },
  statValue: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValuePart: {
    fontSize: 16,
    fontWeight: 500,
    color: colors.textBlack,
  },
  statValueText: {
    fontSize: 16,
    fontWeight: 500,
    color: colors.textBlack,
  },
  statArrow: {
    fontSize: 16,
    fontWeight: 500,
    color: colors.textBlack,
    marginLeft: 4,
    marginRight: 4,
  },
  statLabel: {
    fontSize: 7,
    color: colors.textBlack60,
    marginTop: 3,
  },
  // Section
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 7,
    fontWeight: 500,
    color: colors.textBlack70,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 8,
    color: colors.textBlack60,
    marginBottom: 8,
  },
  // Week card
  weekCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 6,
    overflow: 'hidden',
  },
  weekHeader: {
    backgroundColor: colors.bgBlack5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weekTitle: {
    fontSize: 9,
    fontWeight: 500,
    color: colors.textBlack,
  },
  phaseBadge: {
    fontSize: 6,
    backgroundColor: colors.borderLightGrey,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    color: colors.textBlack70,
  },
  weekContent: {
    padding: 10,
  },
  // Session
  sessionCard: {
    backgroundColor: colors.bgSessionCard,
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionCardHighlight: {
    backgroundColor: colors.bgSessionCard,
  },
  sessionLabel: {
    fontSize: 6,
    fontWeight: 500,
    color: colors.textBlack70,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  sessionDescription: {
    fontSize: 7,
    color: colors.textBlack60,
  },
  sessionDosage: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.textBlack,
  },
  // Progress tracking
  trackingGrid: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 8,
  },
  trackingCard: {
    flex: 1,
    backgroundColor: colors.bgSessionCard,
    borderRadius: 12,
    padding: 8,
  },
  trackingTitle: {
    fontSize: 7,
    fontWeight: 500,
    color: colors.textBlack,
    marginBottom: 2,
  },
  trackingSubtitle: {
    fontSize: 6,
    color: colors.textBlack60,
  },
  rulesBox: {
    backgroundColor: colors.bgBlack5,
    borderRadius: 12,
    padding: 10,
  },
  rulesTitle: {
    fontSize: 7,
    fontWeight: 500,
    color: colors.textBlack70,
    marginBottom: 4,
  },
  ruleItem: {
    fontSize: 7,
    color: colors.textBlack70,
    marginBottom: 2,
  },
  // Product promotion
  productSection: {
    backgroundColor: colors.black,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
  },
  productImage: {
    width: '33%',
    height: 100,
    objectFit: 'cover',
  },
  productContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 11,
    fontWeight: 500,
    color: colors.white,
    marginBottom: 3,
  },
  productDescription: {
    fontSize: 7,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
  },
  productLink: {
    fontSize: 7,
    color: 'rgba(255, 255, 255, 0.9)',
    textDecoration: 'none',
  },
  // Footer
  footer: {
    marginTop: 12,
    paddingTop: 8,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 6,
    color: colors.textBlack50,
  },
});

// Helper for header time display
function formatHoursMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.floor(totalMinutes % 60);
  return `${h}:${m.toString().padStart(2, '0')}h`;
}

// Sport/Event display names
const sportDisplayNames: Record<Sport, string> = {
  triathlon: 'Triathlon',
  cycling: 'Radsport',
  running: 'Laufen',
  gravel: 'Gravel',
};

const eventDisplayNames: Record<EventType, string> = {
  'sprint': 'Sprint',
  'olympic': 'Olympisch',
  'half-ironman': 'Mitteldistanz',
  'ironman': 'Langdistanz',
  'criterium': 'Kriterium',
  'road-race-short': 'Straßenrennen (Kurz)',
  'road-race-long': 'Straßenrennen (Lang)',
  'gran-fondo': 'Gran Fondo',
  'century': 'Century Ride',
  'gravel-short': 'Gravel (Kurz)',
  'gravel-long': 'Gravel (Lang)',
  'ultra-gravel': 'Ultra Gravel',
  '10k': '10 km',
  'half-marathon': 'Halbmarathon',
  'marathon': 'Marathon',
  '50k': '50k Ultra',
  '100k': '100k Ultra',
  '100-mile': '100 Mile Ultra',
};

const giFrequencyLabels: Record<GIFrequency, string> = {
  rarely: 'Selten',
  sometimes: 'Gelegentlich',
  often: 'Häufig',
  'very-often': 'Sehr häufig',
};

const genderLabels: Record<Gender, string> = {
  male: 'Männlich',
  female: 'Weiblich',
  'prefer-not-to-say': 'Keine Angabe',
};

interface ProtocolPdfDocumentProps {
  protocol: ProtocolResult;
  currentIntake: number;
  targetIntake: number;
  sport?: Sport;
  event?: EventType;
  finishTimeMinutes?: number;
  giFrequency?: GIFrequency;
  gender?: Gender;
  frequency?: number;
  sessions: { session1: number; session2: number; session3: number }[];
  weeklyTargets: number[];
}

export default function ProtocolPdfDocument({
  protocol,
  currentIntake,
  targetIntake,
  sport,
  event,
  finishTimeMinutes,
  giFrequency,
  gender,
  frequency = 2,
  sessions,
  weeklyTargets,
}: ProtocolPdfDocumentProps) {
  // Build subtitle parts
  const subtitleParts: string[] = [];
  if (sport) subtitleParts.push(sportDisplayNames[sport]);
  if (event) subtitleParts.push(eventDisplayNames[event]);
  if (finishTimeMinutes) subtitleParts.push(formatHoursMinutes(finishTimeMinutes));
  if (giFrequency) subtitleParts.push(`${giFrequencyLabels[giFrequency]} GI-Beschwerden`);
  if (gender) subtitleParts.push(genderLabels[gender]);

  return (
    <Document>
      <Page size="A5" style={styles.page} wrap={false}>
        {/* Hero */}
        <View style={styles.heroSection} wrap={false}>
          <Text style={styles.title}>Dein Gut-Training-Protokoll</Text>
          {subtitleParts.length > 0 && (
            <Text style={styles.subtitle}>{subtitleParts.join(' • ')}</Text>
          )}
        </View>

        {/* Product Promotion - Moved to top for PDF only */}
        <View style={styles.productSection} wrap={false}>
          <Image
            style={styles.productImage}
            src="https://cdn.shopify.com/s/files/1/0873/9700/7685/files/TV_101_7d3bd0ed-458c-466c-856f-1a1398da6b20.jpg?v=1763976690"
          />
          <View style={styles.productContent}>
            <Text style={styles.productTitle}>Pure Carb – Deine optimale Energiequelle</Text>
            <Text style={styles.productDescription}>
              Geschmacksneutral und maximal magenfreundlich. Von 30–120g/h dosierbar.
            </Text>
            <Link src="https://get-better.co/pure-carb" style={styles.productLink}>
              www.get-better.co/pure-carb
            </Link>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid} wrap={false}>
          <View style={styles.statCard}>
            <View style={styles.statValue}>
              <Text style={styles.statValuePart}>{currentIntake}</Text>
              <Text style={styles.statArrow}>-&gt;</Text>
              <Text style={styles.statValuePart}>{targetIntake}</Text>
            </View>
            <Text style={styles.statLabel}>Ziel (g/h)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValueText}>{protocol.totalWeeks}</Text>
            <Text style={styles.statLabel}>Wochen</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValueText}>{frequency}x</Text>
            <Text style={styles.statLabel}>/Woche</Text>
          </View>
        </View>

        {/* Progression Plan */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Progressionsplan</Text>
          <Text style={styles.sectionDescription}>
            Pro Woche: {frequency} lange Einheit{frequency !== 1 ? 'en' : ''} über 2 Stunden.
          </Text>

          {Array.from({ length: protocol.totalWeeks }, (_, weekIndex) => {
            const week = weekIndex + 1;
            const phase = protocol.phases.find(
              p => week >= p.weekStart && week <= p.weekEnd
            ) || protocol.phases[protocol.phases.length - 1];
            
            const weekSession = sessions[weekIndex] || { session1: currentIntake, session2: currentIntake, session3: currentIntake };
            const weekTarget = weeklyTargets[weekIndex] || currentIntake;
            const previousWeekTarget = weekIndex > 0 ? weeklyTargets[weekIndex - 1] : currentIntake;
            const weeklyJump = weekTarget - previousWeekTarget;
            const hasGradient = weeklyJump >= 6 && week !== protocol.totalWeeks;
            const showTestSessionStyle = protocol.weeklyIncrease >= 2.0 && hasGradient;
            const numStandardSessions = showTestSessionStyle ? frequency - 1 : frequency;

            return (
              <View key={week} style={styles.weekCard} wrap={false}>
                <View style={styles.weekHeader}>
                  <Text style={styles.weekTitle}>Woche {week}</Text>
                  <Text style={styles.phaseBadge}>{phase.phaseName}</Text>
                </View>
                <View style={styles.weekContent}>
                  {showTestSessionStyle ? (
                    <>
                      {Array.from({ length: numStandardSessions }, (_, idx) => {
                        let sessionDosage = weekSession.session1;
                        if (hasGradient) {
                          if (idx === 0) sessionDosage = weekSession.session1;
                          else sessionDosage = weekSession.session2;
                        }
                        return (
                          <View key={idx} style={styles.sessionCard} wrap={false}>
                            <View>
                              <Text style={styles.sessionLabel}>Session {idx + 1}</Text>
                              <Text style={styles.sessionDescription}>Lange Einheit über 2 Stunden</Text>
                            </View>
                            <Text style={styles.sessionDosage}>{sessionDosage}g/h</Text>
                          </View>
                        );
                      })}
                      <View style={[styles.sessionCard, styles.sessionCardHighlight]} wrap={false}>
                        <View>
                          <Text style={styles.sessionLabel}>Session {numStandardSessions + 1}</Text>
                          <Text style={styles.sessionDescription}>Test-Einheit</Text>
                        </View>
                        <Text style={styles.sessionDosage}>{hasGradient ? weekSession.session3 : weekSession.session1}g/h</Text>
                      </View>
                    </>
                  ) : (
                    Array.from({ length: numStandardSessions }, (_, idx) => (
                      <View key={idx} style={styles.sessionCard} wrap={false}>
                        <View>
                          <Text style={styles.sessionLabel}>Session {idx + 1}</Text>
                          <Text style={styles.sessionDescription}>Lange Einheit über 2 Stunden</Text>
                        </View>
                        <Text style={styles.sessionDosage}>{weekSession.session1}g/h</Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Progress Tracking */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Fortschritt verfolgen</Text>
          <View style={styles.trackingGrid} wrap={false}>
            <View style={styles.trackingCard}>
              <Text style={styles.trackingTitle}>Zielzufuhr erreicht?</Text>
              <Text style={styles.trackingSubtitle}>Ja / Teilweise / Nein</Text>
            </View>
            <View style={styles.trackingCard}>
              <Text style={styles.trackingTitle}>GI-Symptome (1–10)</Text>
              <Text style={styles.trackingSubtitle}>1 = keine, 10 = sehr stark</Text>
            </View>
            <View style={styles.trackingCard}>
              <Text style={styles.trackingTitle}>Schwierigkeit (1–10)</Text>
              <Text style={styles.trackingSubtitle}>1 = sehr leicht, 10 = kaum machbar</Text>
            </View>
          </View>
          <View style={styles.rulesBox} wrap={false}>
            <Text style={styles.rulesTitle}>Automatische Anpassungsregeln:</Text>
            <Text style={styles.ruleItem}>• Symptome ≥6 über 2 Wochen → Zufuhr um 15g/h reduzieren</Text>
            <Text style={styles.ruleItem}>• Symptome 4–6 über 2 Wochen → Aktuelles Level halten</Text>
            <Text style={styles.ruleItem}>• Schwierigkeit ≥8 → Anderes Produktformat testen</Text>
            <Text style={styles.ruleItem}>• Symptome &lt;3 UND Ziel erreicht → bereit für +5g/h</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} wrap={false}>
          <Text style={styles.footerText}>
            Erstellt mit dem better Gut-Training Tool • get-better.co
          </Text>
        </View>
      </Page>
    </Document>
  );
}

