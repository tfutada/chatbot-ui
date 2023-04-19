import endent from "endent";
import {Message} from "@/types/chat";
import {OPENAI_API_HOST} from "@/utils/app/const";

import {GoogleSource} from "@/types/google";
import {OpenAIModel} from "@/types/openai";

export async function getAnswerFromChatGPT(userMessage: Message, filteredSources: GoogleSource[], key: string, model: OpenAIModel): Promise<string> {
    const answerPrompt = endent`
    Provide me with the information I requested. Use the sources to provide an accurate response. Respond in markdown format. Cite the sources you used as a markdown link as you use them at the end of each sentence by number of the source (ex: [[1]](link.com)). Provide an accurate response and then stop. Today's date is ${new Date().toLocaleDateString()}.

    Example Input:
    What's the weather in San Francisco today?

    Example Sources:
    [Weather in San Francisco](https://www.google.com/search?q=weather+san+francisco)
    Weather in San Francisco is 70 degrees and sunny today.

    Example Response:
    It's 70 degrees and sunny in San Francisco today. [[1]](https://www.google.com/search?q=weather+san+francisco)

    Input:
    ${userMessage.content.trim()}

    Sources:
    ${filteredSources.map((source) => {
        return endent`
      [${source.title}] (${source.link}):
      ${source.text}
      `;
    })}

    Response:
    `;

    const answerMessage: Message = {role: 'user', content: answerPrompt};
    console.log(answerMessage)

    const answerRes = await fetch(`${OPENAI_API_HOST}/v1/chat/completions`, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key ? key : process.env.OPENAI_API_KEY}`,
            ...(process.env.OPENAI_ORGANIZATION && {
                'OpenAI-Organization': process.env.OPENAI_ORGANIZATION,
            }),
        },
        method: 'POST',
        body: JSON.stringify({
            model: model.id,
            messages: [
                {
                    role: 'system',
                    content: `Use the sources to provide an accurate response. Respond in markdown format. Cite the sources you used as [1](link), etc, as you use them. Maximum 4 sentences.`,
                },
                answerMessage,
            ],
            max_tokens: 1000,
            temperature: 1,
            stream: false,
        }),
    });

    const {choices: choices2} = await answerRes.json();
    console.log(choices2)
    console.log(answerRes.status)

    return choices2[0].message.content;
}