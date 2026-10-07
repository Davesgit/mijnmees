export type SubjectId = 'rekenen' | 'aardrijkskunde' | 'taal';
export type Difficulty = 'makkelijk' | 'past-bij-mij' | 'uitdagend';
export type QuestionType = 'meerkeuze' | 'meerdere-antwoorden' | 'invullen' | 'waar-onwaar' | 'koppelen' | 'ordenen' | 'plaatsen' | 'kaart-aanwijzen' | 'landenpuzzel' | 'meten' | 'wegen' | 'bouwen' | 'coordinaten' | 'model-vullen';
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
export interface Question {
  id: string; version: number; type: QuestionType; subjectId: SubjectId;
  topicId: string; learningGoalId: string; prerequisites: string[];
  groupRange: [number, number]; difficulty: Difficulty; prompt: string;
  options: Json[]; visual: Record<string, Json>; hints: [string,string];
  explanation: string; answer: Json; // privateAnswer server-side in online production!
  bareEquivalent: { prompt: string; preservesGoal: true; reviewedBy: string } | null;
  followUpPool: string[];
  curriculum: { source: string; version: string; status: string };
  review: { status: 'demo-only' | 'draft' | 'approved' | 'archived'; reviewerId: string | null; followUpCoverage?: string };
}
export type PublicQuestion = Omit<Question, 'answer' | 'hints' | 'explanation'>;
export interface SupportState { hints: (1|2)[]; explanationViewed: boolean; wrongAttempts: number; accessibilityTools: string[] }
export interface AttemptSubmission {
  eventId: string; sessionId: string; slotId: string; questionId: string;
  questionVersion: number; answer: Json; sessionVersion: number;
  activeDurationMs?: number; clientTimestamp: string;
}
export interface AttemptEvent extends AttemptSubmission {
  serverTimestamp: string; result: 'correct' | 'incorrect' | 'unanswered';
  support: SupportState; firstAttempt: boolean; source: 'digital' | 'paper';
}
export type SessionState = 'ready' | 'answering' | 'submitting' | 'incorrect' | 'hint1' | 'hint2' | 'explanation' | 'correct' | 'advancing' | 'paused' | 'completed';
export interface ExerciseSession {
  id: string; childId: string | null; guestId: string | null; subjectId: SubjectId;
  topicId: string; mode: 'exercise' | 'table' | 'diagnostic' | 'geography' | 'puzzle';
  slots: {id:string; questionId:string; version:number; repeatOf?:string}[];
  index: number; version: number; state: SessionState; pendingNextSlot: boolean;
  support: SupportState; completedAt: string | null;
}
export interface GoalEvidence { childId:string; goalId:string; independent:number; assisted:number; dueAt:string|null; heuristicVersion:string; state:'no-evidence'|'practising'|'independent'|'review-due' }
export interface HelpEligibility { eligible:boolean; reasons:string[]; evidenceEventIds:string[]; prerequisiteGoalIds:string[]; heuristicVersion:string; consentVersion:string|null }
export interface HelpRequest { id:string; childId:string; goalId:string; firstName:string; status:'new'|'claimed'|'waiting-review'|'closed'; tutorId:string|null; eligibility:HelpEligibility }
export type BoardObject =
  | {id:string; kind:'text'; x:number; y:number; width:number; text:string; fontSize:number}
  | {id:string; kind:'fraction'; x:number; y:number; numerator:number; denominator:number; shape:'bar'|'circle'}
  | {id:string; kind:'shape'; x:number; y:number; shape:'rectangle'|'circle'|'arrow'; width:number; height:number}
  | {id:string; kind:'stroke'; points:[number,number][]; colorToken:string};
export interface BoardEvent { id:string; sequence:number; atMs:number; operation:'add'|'update'|'delete'|'clear'; object?:BoardObject; objectId?:string }
export interface Lesson { id:string; tutorId:string; goalId:string; title:string; startsAtUTC:string; timezone:string; durationMinutes:number; capacity:number; state:'scheduled'|'live'|'ended'|'cancelled'; recording:'none'|'draft'|'review'|'published' }
export interface PrivateLessonQuestion { id:string; lessonId:string; childId:string; text:string; moderation:'pending'|'accepted'|'review'|'rewrite'; response:'waiting'|'answered'|'set-aside'; createdAt:string }
export interface ApiResult<T> { status:'accepted'|'duplicate'|'conflict'|'invalid'|'unauthorized'|'retryable'; data?:T; messageKey?:string; retryAfterMs?:number }
export interface LearningRepository { startSession(config:Record<string,Json>):Promise<ExerciseSession>; submitAttempt(input:AttemptSubmission):Promise<ApiResult<AttemptEvent>>; pauseSession(id:string,version:number):Promise<ApiResult<ExerciseSession>> }
export interface MailProvider { send(templateId:string,recipientAccountId:string,variables:Record<string,string>,idempotencyKey:string):Promise<{accepted:boolean;providerId?:string}> }
export interface LiveProvider { createRoom(lesson:Lesson):Promise<void>; issueToken(lessonId:string,actorId:string,role:'tutor'|'child'):Promise<{token:string;expiresAt:string}>; closeRoom(lessonId:string):Promise<void> }
export interface AiTutorProvider { assist(input:{questionId:string;goalId:string;attemptEventIds:string[]}):Promise<{text:string;reviewRequired:boolean}> }
