# Frequently Asked Questions (FAQ)

## Models and Setup

??? question "What are the best models for octotask?"
For the best experience with octotask, we recommend using the following models:

    - **Claude 3.5 Sonnet (old)**: Best overall coder, providing excellent results across all use cases
    - **Gemini 2.0 Flash**: Exceptional speed while maintaining good performance
    - **GPT-4o**: Strong alternative to Claude 3.5 Sonnet with comparable capabilities
    - **DeepSeekCoder V3**: Best open source model (available through OpenRouter, DeepSeek API, or self-hosted)
    - **DeepSeekCoder V2 236b**: available through OpenRouter, DeepSeek API, or self-hosted
    - **Qwen 2.5 Coder 32b**: Best model for self-hosting with reasonable hardware requirements

    !!! warning
        Models with less than 7b parameters typically lack the capability to properly interact with octotask!

## Best Practices

??? question "How do I get the best results with octotask?" - **Be specific about your stack**:  
 Mention the frameworks or libraries you want to use (e.g., Astro, Tailwind, ShadCN) in your initial prompt. This ensures that octotask scaffolds the project according to your preferences.

    - **Use the enhance prompt icon**:
      Before sending your prompt, click the *enhance* icon to let the AI refine your prompt. You can edit the suggested improvements before submitting.

    - **Scaffold the basics first, then add features**:
      Ensure the foundational structure of your application is in place before introducing advanced functionality. This helps octotask establish a solid base to build on.

    - **Batch simple instructions**:
      Combine simple tasks into a single prompt to save time and reduce API credit consumption. For example:
      *"Change the color scheme, add mobile responsiveness, and restart the dev server."*

## Project Information

??? question "How do I contribute to octotask?"
Check out our [Contribution Guide](CONTRIBUTING.md) for more details on how to get involved!

??? question "What are the future plans for octotask?"
updates.  
 New features and improvements are on the way!

??? question "Why are there so many open issues/pull requests?"
octotask began as a small showcase project on @octotsk explore editing open-source projects with local LLMs. However, it quickly grew into a massive community effort!

    We're forming a team of maintainers to manage demand and streamline issue resolution. The maintainers are rockstars, and we're also exploring partnerships to help the project thrive.

## Model Comparisons

??? question "How do local LLMs compare to larger models like Claude 3.5 Sonnet for octotask?"
While local LLMs are improving rapidly, larger models like GPT-4o, Claude 3.5 Sonnet, and DeepSeek Coder V2 236b still offer the best results for complex applications. Our ongoing focus is to improve prompts, agents, and the platform to better support smaller local LLMs.

## Troubleshooting

??? error "There was an error processing this request"
This generic error message means something went wrong. Check both:

    - The terminal (if you started the app with Docker or `pnpm`).

    - The developer console in your browser (press `F12` or right-click > *Inspect*, then go to the *Console* tab).

??? error "x-api-key header missing"
This error is sometimes resolved by restarting the Docker container.  
 If that doesn't work, try switching from Docker to `pnpm` or vice versa. We're actively investigating this issue.

??? error "Blank preview when running the app"
A blank preview often occurs due to hallucinated bad code or incorrect commands.  
 To troubleshoot:

    - Check the developer console for errors.

    - Remember, previews are core functionality, so the app isn't broken! We're working on making these errors more transparent.

??? error "Everything works, but the results are bad"
Local LLMs like Qwen-2.5-Coder are powerful for small applications but still experimental for larger projects. For better results, consider using larger models like

    - GPT-4o
    - Claude 3.5 Sonnet
    - DeepSeek Coder V2 236b

??? error "Received structured exception #0xc0000005: access violation"
If you are getting this, you are probably on Windows. The fix is generally to update the [Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170)

??? error "Miniflare or Wrangler errors in Windows"
You will need to make sure you have the latest version of Visual Studio C++ installed (14.40.33816), more information here <a href="https://github.com/octotask/octotask/issues/19">Github Issues</a>

---

## Get Help & Support

!!! tip "Community Support"
[Join the octotask Community](https://thinktank.ottomator.ai/c/octotask/17){target=\_blank} for discussions and help

!!! bug "Report Issues"
[Open an Issue](https://github.com/octotask/octotask/issues/19){target=\_blank} in our GitHub Repository
