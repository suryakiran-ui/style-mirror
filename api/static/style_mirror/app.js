const API_BASE = "http://127.0.0.1:8000";

let accessToken = "";
let currentProjectId = null;
let currentProfileId = null;


// ==========================================
// LOGIN TOKEN
// ==========================================

accessToken = prompt(
    "Paste your Supabase access token:"
);

if (!accessToken) {
    alert("Supabase access token is required.");
}


// ==========================================
// COMMON HEADERS
// ==========================================

function authHeaders() {

    return {
        "Authorization": `Bearer ${accessToken}`
    };
}


// ==========================================
// GENERATE STYLE
// ==========================================

document
    .getElementById("generateButton")
    .addEventListener("click", generateStyle);


async function generateStyle() {

    const referenceInput =
        document.getElementById("referenceImage");

    const originalInput =
        document.getElementById("originalImage");

    const status =
        document.getElementById("status");


    if (!referenceInput.files.length) {

        alert("Please select a reference image.");

        return;
    }


    if (!originalInput.files.length) {

        alert("Please select your photo.");

        return;
    }


    status.innerText =
        "Analyzing reference image...";


    try {

        // ==================================
        // STEP 1
        // Generate AI Style Profile
        // ==================================

        const referenceForm =
            new FormData();

        referenceForm.append(
            "image",
            referenceInput.files[0]
        );


        const profileResponse =
            await fetch(
                `${API_BASE}/api/generate-style-profile/`,
                {
                    method: "POST",

                    headers: authHeaders(),

                    body: referenceForm
                }
            );


        const profileData =
            await profileResponse.json();


        if (!profileResponse.ok) {

            throw new Error(
                profileData.error ||
                "Style profile generation failed."
            );
        }


        currentProfileId =
            profileData.profile_id;


        // ==================================
        // SHOW STYLE PARAMETERS
        // ==================================

        const style =
            profileData.style;


        document.getElementById("lightness")
            .innerText = style.lightness;

        document.getElementById("contrast")
            .innerText = style.contrast;

        document.getElementById("warmth")
            .innerText = style.warmth;

        document.getElementById("saturation")
            .innerText = style.saturation;

        document.getElementById("highlight")
            .innerText = style.highlight;

        document.getElementById("shadow")
            .innerText = style.shadow;


        status.innerText =
            "Style detected. Uploading your photo...";


        // ==================================
        // STEP 2
        // Upload Original Image
        // ==================================

        const originalForm =
            new FormData();

        originalForm.append(
            "image",
            originalInput.files[0]
        );

        originalForm.append(
            "image_type",
            "original"
        );


        const uploadResponse =
            await fetch(
                `${API_BASE}/api/uploaded-images/`,
                {
                    method: "POST",

                    headers: authHeaders(),

                    body: originalForm
                }
            );


        const uploadData =
            await uploadResponse.json();


        if (!uploadResponse.ok) {

            throw new Error(
                uploadData.detail ||
                uploadData.error ||
                "Image upload failed."
            );
        }


        // ==================================
        // SHOW ORIGINAL PREVIEW
        // ==================================

        const originalResult = document.getElementById("originalResult");
        if (originalResult) {
            originalResult.src = uploadData.image;
            originalResult.classList.add("has-image");
        }


        // ==================================
        // STEP 3
        // Create Project
        // ==================================

        status.innerText =
            "Creating STYLE MIRROR project...";


        const projectData = {

            name: "STYLE MIRROR Project",

            original_image_url:
                uploadData.image,

            editing_profile:
                currentProfileId
        };


        const projectResponse =
            await fetch(
                `${API_BASE}/api/projects/`,
                {
                    method: "POST",

                    headers: {
                        ...authHeaders(),

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(projectData)
                }
            );


        const project =
            await projectResponse.json();


        if (!projectResponse.ok) {

            throw new Error(
                project.detail ||
                project.error ||
                "Project creation failed."
            );
        }


        currentProjectId =
            project.id;


        // ==================================
        // STEP 4
        // Apply Style
        // ==================================

        status.innerText =
            "Applying AI style...";


        const applyResponse =
            await fetch(
                `${API_BASE}/api/apply-style/`,
                {
                    method: "POST",

                    headers: {
                        ...authHeaders(),

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            project_id:
                                currentProjectId,

                            profile_id:
                                currentProfileId

                        })
                }
            );


        const applyData =
            await applyResponse.json();


        if (!applyResponse.ok) {

            throw new Error(
                applyData.error ||
                "Style application failed."
            );
        }


        // ==================================
        // SHOW EDITED IMAGE
        // ==================================

        const editedPreview = document.getElementById("editedPreview");
        if (editedPreview) {
            editedPreview.src = applyData.edited_image_url;
            editedPreview.classList.add("has-image");
        }


        status.innerText =
            "STYLE MIRROR editing completed!";


        // Scroll to result

        document
            .getElementById("result")
            .scrollIntoView({
                behavior: "smooth"
            });


        // Load history

        loadHistory();


    } catch (error) {

        console.error(error);

        status.innerText =
            "Error: " + error.message;

        alert(error.message);
    }
}


// ==========================================
// REGENERATE
// ==========================================

document
    .getElementById("regenerateButton")
    .addEventListener(
        "click",
        regenerateImage
    );


async function regenerateImage() {

    if (!currentProjectId) {

        alert(
            "Please generate a style first."
        );

        return;
    }


    const status =
        document.getElementById("status");


    status.innerText =
        "Regenerating image...";


    try {

        const response =
            await fetch(
                `${API_BASE}/api/projects/${currentProjectId}/regenerate/`,
                {
                    method: "POST",

                    headers:
                        authHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Regeneration failed."
            );
        }


        const editedPreview = document.getElementById("editedPreview");
        if (editedPreview) {
            editedPreview.src = data.image_url;
            editedPreview.classList.add("has-image");
        }


        status.innerText =
            `Generation ${data.generation_number} created successfully.`;


        loadHistory();


    } catch (error) {

        console.error(error);

        status.innerText =
            "Error: " + error.message;
    }
}


// ==========================================
// EXPORT
// ==========================================

document
    .getElementById("exportButton")
    .addEventListener(
        "click",
        exportImage
    );


async function exportImage() {

    if (!currentProjectId) {

        alert(
            "Please generate a style first."
        );

        return;
    }


    const imageURL =
        document
            .getElementById("editedPreview")
            .src;


    try {

        const response =
            await fetch(
                `${API_BASE}/api/exports/`,
                {
                    method: "POST",

                    headers: {
                        ...authHeaders(),

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            project:
                                currentProjectId,

                            file_url:
                                imageURL,

                            file_type:
                                "jpg"

                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Export failed."
            );
        }


        alert(
            "Image export recorded successfully!"
        );


        // Open image

        window.open(
            imageURL,
            "_blank"
        );


    } catch (error) {

        console.error(error);

        alert(
            "Export error: " +
            error.message
        );
    }
}


// ==========================================
// HISTORY
// ==========================================

async function loadHistory() {

    try {

        const response =
            await fetch(
                `${API_BASE}/api/history/`,
                {
                    headers:
                        authHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                "Could not load history."
            );
        }


        const container =
            document.getElementById(
                "historyContainer"
            );


        container.innerHTML = "";


        if (!data.history.length) {

            container.innerHTML =
                "<p>No projects yet.</p>";

            return;
        }


        data.history.forEach(
            project => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "history-item";


                item.innerHTML = `

                    <h3>
                        ${project.project_name}
                    </h3>

                    <p>
                        Style:
                        ${project.editing_profile}
                    </p>

                    <p>
                        Generations:
                        ${project.regenerations.length}
                    </p>

                `;


                container.appendChild(item);

            }
        );


    } catch (error) {

        console.error(
            "History error:",
            error
        );
    }
}


// ==========================================
// LOAD HISTORY WHEN PAGE OPENS
// ==========================================

loadHistory();

// ==========================================
// FRONTEND POLISH: IMAGE PREVIEWS + PARAMETERS
// ==========================================
function wireImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;

    input.addEventListener("change", () => {
        const file = input.files && input.files[0];
        if (!file) {
            preview.removeAttribute("src");
            preview.classList.remove("has-image");
            return;
        }
        if (!file.type.startsWith("image/")) {
            alert("Please choose an image file.");
            input.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            preview.src = reader.result;
            preview.classList.add("has-image");
        };
        reader.readAsDataURL(file);
    });
}

wireImagePreview("referenceImage", "referencePreview");
wireImagePreview("originalImage", "originalPreview");

// Keep the upload preview and final result visually separate.
const originalFileInput = document.getElementById("originalImage");
if (originalFileInput) {
    originalFileInput.addEventListener("change", () => {
        const file = originalFileInput.files && originalFileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const resultImage = document.getElementById("originalResult");
            if (resultImage) {
                resultImage.src = reader.result;
                resultImage.classList.add("has-image");
            }
        };
        reader.readAsDataURL(file);
    });
}
