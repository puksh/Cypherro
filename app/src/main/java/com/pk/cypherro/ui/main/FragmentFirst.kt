package com.pk.cypherro.ui.main

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import com.pk.cypherro.databinding.FragmentMainBinding
import javax.crypto.Cipher
import javax.crypto.spec.SecretKeySpec

/**
 * A placeholder fragment containing a simple view.
 */
class FragmentFirst : Fragment() {

    private lateinit var pageViewModel: PageViewModel
    private var _binding: FragmentMainBinding? = null

    // This property is only valid between onCreateView and
// onDestroyView.
    private val binding get() = _binding!!

    private val _pickFileResult = 1

    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { selectedFileUri ->
        selectedFileUri?.let {
            // Get the selected file's content
            val inputStream = context?.contentResolver?.openInputStream(selectedFileUri)
            val fileContent = inputStream?.readBytes()

            // Encrypt the file content using AES encryption
            val key = "mysecretkey"
            val secretKeySpec = SecretKeySpec(key.toByteArray(), "AES")
            val cipher = Cipher.getInstance("AES")
            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec)
            val encryptedBytes = cipher.doFinal(fileContent)

            // Create an email intent and attach the encrypted file to it
            val emailIntent = Intent(Intent.ACTION_SEND)
            emailIntent.type = "application/octet-stream"
            emailIntent.putExtra(Intent.EXTRA_STREAM, encryptedBytes)

            // Launch the email client to send the email
            startActivity(Intent.createChooser(emailIntent, "Send email..."))
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        pageViewModel = ViewModelProvider(this)[PageViewModel::class.java].apply {
            setIndex(arguments?.getInt(ARG_SECTION_NUMBER) ?: 1)
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {

        _binding = FragmentMainBinding.inflate(inflater, container, false)
        val root = binding.root

        val textView: TextView = binding.sectionLabel
        pageViewModel.text.observe(viewLifecycleOwner) {
            textView.text = it
        }

        // Find the send button in the layout
        val sendButton = binding.sendButton

        // Set a click listener on the send button
        sendButton.setOnClickListener {
            filePickerLauncher.launch("*/*")
        }

        return root
    }

    companion object {

        //The fragment argument representing the section number for this fragment.
        private const val ARG_SECTION_NUMBER = "section_number"

        //Returns a new instance of this fragment for the given section number.
        @JvmStatic
        fun newInstance(sectionNumber: Int): FragmentFirst {
            return FragmentFirst().apply {
                arguments = Bundle().apply {
                    putInt(ARG_SECTION_NUMBER, sectionNumber)
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

}
