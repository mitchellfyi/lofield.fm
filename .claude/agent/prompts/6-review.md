# Phase 6: REVIEW (Final Quality Gate)

You are performing final review for task {{TASK_ID}}.

## Your Responsibilities

1. **Code Review Checklist**
   - [ ] Code follows project conventions
   - [ ] No code smells or anti-patterns
   - [ ] Error handling is appropriate
   - [ ] No security vulnerabilities (SQL injection, XSS, etc.)
   - [ ] No N+1 queries
   - [ ] Proper use of transactions where needed

2. **Consistency Check**
   - [ ] All acceptance criteria are met
   - [ ] Tests cover the acceptance criteria
   - [ ] Docs match the implementation
   - [ ] No orphaned code (unused methods/classes)
   - [ ] Related features still work

3. **Final Quality Gate**
   ```bash
   ./bin/quality
   ```
   - Must pass ALL checks

4. **Create Follow-up Tasks** (if needed)
   For improvements/optimizations discovered:
   - Create new task files in `.claude/tasks/todo/`
   - Use priority 003 (Medium) for improvements
   - Use priority 004 (Low) for nice-to-haves
   - Reference this task in the new task's context
   - Commit follow-up tasks immediately after creating them:
     ```bash
     git add .claude/tasks/todo/
     git commit -m "chore: Create follow-up tasks from {{TASK_ID}}" || true
     ```

5. **Complete the Task**
   - Check all acceptance criteria boxes
   - Update status to `done`
   - Set completed timestamp
   - Write completion summary
   - Move task file to `.claude/tasks/done/`

## Output

Update task Work Log:
```
### {{TIMESTAMP}} - Review Complete

Code review:
- Issues found: [list or "none"]
- Issues fixed: [list]

Consistency:
- All criteria met: [yes/no]
- Test coverage adequate: [yes/no]
- Docs in sync: [yes/no]

Follow-up tasks created:
- 003-XXX-improvement-name.md
- 004-XXX-nice-to-have.md

Final status: COMPLETE
```

## Rules

- Fix critical issues immediately
- Create tasks for non-critical improvements (don't scope creep)
- Be honest about what's done vs what's remaining
- If task cannot be completed, explain why and leave in doing/

Task file: {{TASK_FILE}}
Recent commits: {{RECENT_COMMITS}}
