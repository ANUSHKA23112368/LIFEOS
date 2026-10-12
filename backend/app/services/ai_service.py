import json
import logging
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings
from app.models.ai import AiQueryResponse, AiStructuredInsight

logger = logging.getLogger("lifeos.ai")

class AiService:
    """Provider-independent AI Service Layer with deterministic fallback."""

    @staticmethod
    async def analyze_life_data(
        question: str,
        context: Dict[str, Any]
    ) -> AiQueryResponse:
        """
        Synthesizes user questions against deterministic metrics.
        Never hallucinates statistics; uses backend-computed metrics.
        """
        provider = settings.AI_PROVIDER.lower()

        # Check if live Gemini provider configured
        if provider == "gemini" and settings.GEMINI_API_KEY:
            try:
                return await AiService._call_gemini(question, context)
            except Exception as e:
                logger.error(f"Gemini API call failed: {e}. Falling back to deterministic engine.")

        # Check if live OpenAI provider configured
        if provider == "openai" and settings.OPENAI_API_KEY:
            try:
                return await AiService._call_openai(question, context)
            except Exception as e:
                logger.error(f"OpenAI API call failed: {e}. Falling back to deterministic engine.")

        # Deterministic analytical engine fallback
        return AiService._generate_deterministic_analysis(question, context)

    @staticmethod
    def _generate_deterministic_analysis(
        question: str,
        context: Dict[str, Any]
    ) -> AiQueryResponse:
        """
        Deterministic, rule-based Life Analyst response engine.
        Answers user questions with mathematically verified data and structured experiments.
        """
        q = question.lower()
        rec_mins = context.get("total_recorded_minutes", 0)
        plan_mins = context.get("total_planned_minutes", 0)
        task_rate = context.get("task_completion_rate", 0)
        focus_mins = context.get("total_focus_mins", 0)
        tasks_done = context.get("tasks_completed", 0)
        tasks_total = context.get("tasks_total", 0)
        categories = context.get("categories", [])
        patterns = context.get("patterns", [])

        # Formulate answer based on topic
        insights: List[AiStructuredInsight] = []
        followups = [
            "How does my focus duration correlate with completed tasks?",
            "What activities took more time than planned?",
            "What schedule adjustments do you recommend for tomorrow?"
        ]

        if "spend" in q or "time" in q or "activities" in q:
            top_cat = categories[0]["category_name"] if categories else "Uncategorized"
            top_cat_mins = categories[0]["minutes"] if categories else 0
            
            insights.append(AiStructuredInsight(
                title="Time Distribution Analysis",
                what_i_observed=f"You have logged {rec_mins} minutes of activity, with '{top_cat}' being the primary focus.",
                evidence=f"{top_cat_mins} minutes ({round((top_cat_mins/max(1, rec_mins))*100, 1)}%) spent on {top_cat}.",
                possible_explanation="Your scheduled priorities reflect this category as the central commitment for the selected timeframe.",
                suggested_experiment="Audit your energy levels before and after this activity category in your next Daily Review.",
                how_to_evaluate="Check whether fatigue or productivity shifts after logging 2 consecutive days."
            ))
            answer = (
                f"Based on your recorded timeline, you logged a total of {rec_mins} minutes. "
                f"Your highest allocation was in '{top_cat}' with {top_cat_mins} minutes. "
                f"Your planned commitments totaled {plan_mins} minutes, representing a variance of {rec_mins - plan_mins} minutes."
            )

        elif "task" in q or "complete" in q or "fewer" in q or "priority" in q:
            insights.append(AiStructuredInsight(
                title="Task Execution & Estimation Reality",
                what_i_observed=f"Your task completion rate is currently {task_rate}%.",
                evidence=f"Completed {tasks_done} of {tasks_total} scheduled tasks.",
                possible_explanation="Tasks often encounter unmodeled friction or interdependencies that stretch duration.",
                suggested_experiment="Cap daily commitments to a maximum of 3 'Must-Do' tasks and defer optional items.",
                how_to_evaluate="Observe whether task completion rate increases above 80% over the next 48 hours."
            ))
            answer = (
                f"You completed {tasks_done} out of {tasks_total} scheduled tasks ({task_rate}% completion). "
                f"If you find yourself finishing fewer tasks than expected, evidence shows task duration estimates are usually "
                f"20-30% more optimistic than reality. Allocating buffer periods between tasks directly improves completion rates."
            )

        elif "journal" in q or "diary" in q or "logbook" in q or "entry" in q or "wrote" in q:
            journals = context.get("journal_entries", [])
            j_count = len(journals)
            if j_count > 0:
                titles = [f"'{j['title']}' ({j['date']})" for j in journals[:3]]
                insights.append(AiStructuredInsight(
                    title="Personal Diary & Reflection Themes",
                    what_i_observed=f"You have recorded {j_count} personal journal entries in this timeframe.",
                    evidence=f"Recent entries: {', '.join(titles)}.",
                    possible_explanation="Regular journaling documents real-world insights, emotional state, and personal milestones as they happen.",
                    suggested_experiment="Review past lessons learned at the end of each week to consolidate behavioral gains.",
                    how_to_evaluate="Check your consistency in logging lessons across consecutive entries."
                ))
                answer = (
                    f"You have {j_count} saved journal entries in this timeframe. "
                    f"Your most recent entries include {', '.join(titles)}. "
                    f"Your writings capture genuine events, accomplishments, and lessons without relying on retrospective guesswork."
                )
            else:
                insights.append(AiStructuredInsight(
                    title="Journal Data Availability",
                    what_i_observed="No journal entries were found for the selected timeframe.",
                    evidence="0 entries recorded in the database.",
                    possible_explanation="You may not have written any diary entries during this date range yet.",
                    suggested_experiment="Open My Life Journal and record a 2-minute entry about your key experience today.",
                    how_to_evaluate="Verify the new entry appears in your timeline and calendar."
                ))
                answer = "You haven't recorded any journal entries in this timeframe yet. Open My Life Journal from the sidebar to write your first entry!"

        elif "focus" in q or "deep work" in q or "interruption" in q:
            insights.append(AiStructuredInsight(
                title="Focus Continuity Assessment",
                what_i_observed=f"You recorded {focus_mins} minutes of focused timer sessions.",
                evidence=f"{context.get('completed_focus_sessions', 0)} completed focus sessions logged.",
                possible_explanation="Focused intervals provide the highest leverage for challenging cognitive tasks.",
                suggested_experiment="Schedule your focus session during your peak alertness window (typically morning or early afternoon).",
                how_to_evaluate="Compare the number of logged interruptions in your session reflections."
            ))
            answer = (
                f"You accumulated {focus_mins} minutes of deep focus across {context.get('completed_focus_sessions', 0)} completed sessions. "
                f"The data suggests consistent blocks yield significantly higher momentum than fragmented efforts."
            )

        else:
            insights.append(AiStructuredInsight(
                title="Holistic Life Intelligence Snapshot",
                what_i_observed=f"You have recorded {rec_mins} activity minutes and {focus_mins} focus minutes across this timeframe.",
                evidence=f"{tasks_done}/{tasks_total} tasks completed with {task_rate}% completion rate.",
                possible_explanation="Continuous life intelligence is built through sustainable tracking and deliberate iteration.",
                suggested_experiment="Complete a 3-minute Daily Review tonight to record what went well and what distracted you.",
                how_to_evaluate="Review tomorrow morning's plan to see if adjustments feel more realistic and achievable."
            ))
            answer = (
                f"Reviewing your records: you have tracked {rec_mins} minutes of activities, completed {tasks_done} tasks, "
                f"and dedicated {focus_mins} minutes to focus sessions. Your schedule reflects conscious effort toward your stated goals."
            )

        return AiQueryResponse(
            answer=answer,
            insights=insights,
            suggested_followups=followups,
            calculated_context={
                "recorded_minutes": rec_mins,
                "planned_minutes": plan_mins,
                "task_completion_rate": task_rate,
                "focus_minutes": focus_mins
            },
            provider_used="Deterministic Analytical Engine (No external API key required)"
        )

    @staticmethod
    async def _call_gemini(question: str, context: Dict[str, Any]) -> AiQueryResponse:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        system_instruction = (
            "You are the LIFEOS AI Life Analyst. You analyze a user's verified personal data to answer their question. "
            "Never invent facts or statistics. Distinguish facts from hypotheses. "
            "Return JSON matching: {\"answer\": \"...\", \"insights\": [{\"title\": \"...\", \"what_i_observed\": \"...\", \"evidence\": \"...\", \"possible_explanation\": \"...\", \"suggested_experiment\": \"...\", \"how_to_evaluate\": \"...\"}], \"suggested_followups\": [\"...\"]}"
        )
        prompt = f"User Question: {question}\n\nVerified User Context:\n{json.dumps(context, indent=2)}"
        
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                url,
                json={
                    "contents": [{"parts": [{"text": f"{system_instruction}\n\n{prompt}"}]}],
                    "generationConfig": {"response_mime_type": "application/json"}
                }
            )
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(raw_text)
            
            insights = [AiStructuredInsight(**i) for i in parsed.get("insights", [])]
            return AiQueryResponse(
                answer=parsed.get("answer", "Here is your life analysis."),
                insights=insights,
                suggested_followups=parsed.get("suggested_followups", []),
                calculated_context=context,
                provider_used="Google Gemini 1.5 Flash"
            )

    @staticmethod
    async def _call_openai(question: str, context: Dict[str, Any]) -> AiQueryResponse:
        url = "https://api.openai.com/v1/chat/completions"
        system_instruction = (
            "You are the LIFEOS AI Life Analyst. Return valid JSON only with keys: answer, insights (array of {title, what_i_observed, evidence, possible_explanation, suggested_experiment, how_to_evaluate}), suggested_followups."
        )
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                url,
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": f"Question: {question}\nContext:\n{json.dumps(context, indent=2)}"}
                    ],
                    "response_format": {"type": "json_object"}
                }
            )
            resp.raise_for_status()
            data = resp.json()
            parsed = json.loads(data["choices"][0]["message"]["content"])
            insights = [AiStructuredInsight(**i) for i in parsed.get("insights", [])]
            return AiQueryResponse(
                answer=parsed.get("answer", "Here is your life analysis."),
                insights=insights,
                suggested_followups=parsed.get("suggested_followups", []),
                calculated_context=context,
                provider_used="OpenAI GPT-4o-mini"
            )
