package com.pdf2in;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;
import org.apache.pdfbox.contentstream.PDFGraphicsStreamEngine;
import org.apache.pdfbox.pdmodel.graphics.image.PDImage;

import org.docx4j.openpackaging.packages.WordprocessingMLPackage;
import org.docx4j.openpackaging.parts.WordprocessingML.MainDocumentPart;
import org.docx4j.wml.*;

import java.awt.geom.Point2D;
import java.io.File;
import java.io.IOException;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;

/**
 * PDF to DOCX Converter using Apache PDFBox and docx4j.
 *
 * Usage: java -jar converter.jar input.pdf output.docx
 */
public class PdfToDocxConverter {

    private static final ObjectFactory factory = new ObjectFactory();

    public static void main(String[] args) {
        if (args.length < 2) {
            System.err.println("Usage: java -jar converter.jar <input.pdf> <output.docx>");
            System.exit(1);
        }

        String inputPath = args[0];
        String outputPath = args[1];

        try {
            convert(inputPath, outputPath);
            System.out.println("Conversion successful: " + outputPath);
            System.exit(0);
        } catch (Exception e) {
            System.err.println("Conversion failed: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    public static void convert(String inputPath, String outputPath) throws Exception {
        File inputFile = new File(inputPath);
        if (!inputFile.exists()) {
            throw new IOException("Input file not found: " + inputPath);
        }

        // Load PDF
        try (PDDocument pdfDocument = Loader.loadPDF(inputFile)) {
            // Create DOCX
            WordprocessingMLPackage wordPackage = WordprocessingMLPackage.createPackage();
            MainDocumentPart mainPart = wordPackage.getMainDocumentPart();

            int totalPages = pdfDocument.getNumberOfPages();

            for (int pageNum = 0; pageNum < totalPages; pageNum++) {
                PDPage page = pdfDocument.getPage(pageNum);

                // Add page break between pages (except first)
                if (pageNum > 0) {
                    addPageBreak(mainPart);
                }

                // Extract text with positioning
                List<TextBlock> textBlocks = extractTextBlocks(pdfDocument, pageNum);

                // Extract lines/drawings
                List<HorizontalLine> lines = extractLines(pdfDocument, pageNum);

                // Sort content by Y position (top to bottom)
                List<PageContent> allContent = new ArrayList<>();
                for (TextBlock block : textBlocks) {
                    allContent.add(new PageContent(block.y, block));
                }
                for (HorizontalLine line : lines) {
                    allContent.add(new PageContent(line.y, line));
                }
                allContent.sort((a, b) -> Float.compare(a.y, b.y));

                // Add content to document
                for (PageContent content : allContent) {
                    if (content.content instanceof TextBlock) {
                        TextBlock block = (TextBlock) content.content;
                        addTextBlock(mainPart, block);
                    } else if (content.content instanceof HorizontalLine) {
                        addHorizontalLine(mainPart);
                    }
                }
            }

            // Save DOCX
            wordPackage.save(new File(outputPath));
        }
    }

    private static List<TextBlock> extractTextBlocks(PDDocument document, int pageNum) throws IOException {
        List<TextBlock> blocks = new ArrayList<>();

        PDFTextStripper stripper = new PDFTextStripper() {
            private StringBuilder currentLine = new StringBuilder();
            private float currentY = -1;
            private float currentFontSize = 11;
            private boolean isBold = false;
            private boolean isItalic = false;

            @Override
            protected void writeString(String text, List<TextPosition> textPositions) throws IOException {
                if (textPositions.isEmpty()) return;

                TextPosition first = textPositions.get(0);
                float y = first.getY();
                float fontSize = first.getFontSize();
                String fontName = first.getFont().getName().toLowerCase();

                boolean bold = fontName.contains("bold");
                boolean italic = fontName.contains("italic") || fontName.contains("oblique");

                // Check if this is a new line
                if (currentY != -1 && Math.abs(y - currentY) > fontSize * 0.5) {
                    // Save current line
                    if (currentLine.length() > 0) {
                        blocks.add(new TextBlock(
                            currentLine.toString().trim(),
                            currentY,
                            currentFontSize,
                            isBold,
                            isItalic
                        ));
                        currentLine = new StringBuilder();
                    }
                }

                currentLine.append(text);
                currentY = y;
                currentFontSize = fontSize;
                isBold = bold;
                isItalic = italic;
            }

            @Override
            protected void endPage(PDPage page) throws IOException {
                // Save last line
                if (currentLine.length() > 0) {
                    blocks.add(new TextBlock(
                        currentLine.toString().trim(),
                        currentY,
                        currentFontSize,
                        isBold,
                        isItalic
                    ));
                }
                super.endPage(page);
            }
        };

        stripper.setStartPage(pageNum + 1);
        stripper.setEndPage(pageNum + 1);
        stripper.getText(document);

        return blocks;
    }

    private static List<HorizontalLine> extractLines(PDDocument document, int pageNum) {
        List<HorizontalLine> lines = new ArrayList<>();

        try {
            PDPage page = document.getPage(pageNum);

            LineExtractor extractor = new LineExtractor(page, lines);
            extractor.processPage(page);

        } catch (Exception e) {
            System.err.println("Warning: Could not extract lines from page " + pageNum + ": " + e.getMessage());
        }

        return lines;
    }

    private static void addTextBlock(MainDocumentPart mainPart, TextBlock block) {
        P paragraph = factory.createP();

        // Create run with text
        R run = factory.createR();
        Text text = factory.createText();
        text.setValue(block.text);
        text.setSpace("preserve");
        run.getContent().add(text);

        // Apply formatting
        RPr runProps = factory.createRPr();

        // Font size (half-points)
        HpsMeasure fontSize = factory.createHpsMeasure();
        fontSize.setVal(BigInteger.valueOf((long) (block.fontSize * 2)));
        runProps.setSz(fontSize);
        runProps.setSzCs(fontSize);

        // Bold
        if (block.isBold) {
            BooleanDefaultTrue bold = factory.createBooleanDefaultTrue();
            runProps.setB(bold);
            runProps.setBCs(bold);
        }

        // Italic
        if (block.isItalic) {
            BooleanDefaultTrue italic = factory.createBooleanDefaultTrue();
            runProps.setI(italic);
            runProps.setICs(italic);
        }

        run.setRPr(runProps);
        paragraph.getContent().add(run);
        mainPart.getContent().add(paragraph);
    }

    private static void addHorizontalLine(MainDocumentPart mainPart) {
        P paragraph = factory.createP();

        // Create paragraph properties with bottom border
        PPr pPr = factory.createPPr();
        PPrBase.PBdr pBdr = factory.createPPrBasePBdr();

        CTBorder bottom = factory.createCTBorder();
        bottom.setVal(STBorder.SINGLE);
        bottom.setSz(BigInteger.valueOf(6));
        bottom.setSpace(BigInteger.valueOf(1));
        bottom.setColor("000000");

        pBdr.setBottom(bottom);
        pPr.setPBdr(pBdr);
        paragraph.setPPr(pPr);

        mainPart.getContent().add(paragraph);
    }

    private static void addPageBreak(MainDocumentPart mainPart) {
        P paragraph = factory.createP();
        R run = factory.createR();
        Br pageBreak = factory.createBr();
        pageBreak.setType(STBrType.PAGE);
        run.getContent().add(pageBreak);
        paragraph.getContent().add(run);
        mainPart.getContent().add(paragraph);
    }

    // Helper classes
    static class TextBlock {
        String text;
        float y;
        float fontSize;
        boolean isBold;
        boolean isItalic;

        TextBlock(String text, float y, float fontSize, boolean isBold, boolean isItalic) {
            this.text = text;
            this.y = y;
            this.fontSize = fontSize;
            this.isBold = isBold;
            this.isItalic = isItalic;
        }
    }

    static class HorizontalLine {
        float y;
        float x1, x2;

        HorizontalLine(float y, float x1, float x2) {
            this.y = y;
            this.x1 = x1;
            this.x2 = x2;
        }
    }

    static class PageContent {
        float y;
        Object content;

        PageContent(float y, Object content) {
            this.y = y;
            this.content = content;
        }
    }

    // Line extractor using PDFBox graphics stream engine
    static class LineExtractor extends PDFGraphicsStreamEngine {
        private List<HorizontalLine> lines;
        private Point2D lastMoveTo;

        LineExtractor(PDPage page, List<HorizontalLine> lines) {
            super(page);
            this.lines = lines;
        }

        @Override
        public void moveTo(float x, float y) {
            lastMoveTo = new Point2D.Float(x, y);
        }

        @Override
        public void lineTo(float x, float y) {
            if (lastMoveTo != null) {
                float y1 = (float) lastMoveTo.getY();
                float x1 = (float) lastMoveTo.getX();

                // Check if horizontal line (y coordinates similar)
                if (Math.abs(y1 - y) < 2) {
                    // Convert to page coordinates (PDF origin is bottom-left)
                    float pageHeight = getPage().getMediaBox().getHeight();
                    float docY = pageHeight - y;
                    lines.add(new HorizontalLine(docY, Math.min(x1, x), Math.max(x1, x)));
                }
            }
            lastMoveTo = new Point2D.Float(x, y);
        }

        @Override
        public void curveTo(float x1, float y1, float x2, float y2, float x3, float y3) {
            lastMoveTo = new Point2D.Float(x3, y3);
        }

        @Override
        public Point2D getCurrentPoint() {
            return lastMoveTo;
        }

        @Override
        public void closePath() {}

        @Override
        public void endPath() {}

        @Override
        public void strokePath() {}

        @Override
        public void fillPath(int windingRule) {}

        @Override
        public void fillAndStrokePath(int windingRule) {}

        @Override
        public void shadingFill(org.apache.pdfbox.cos.COSName shadingName) {}

        @Override
        public void drawImage(PDImage pdImage) {}

        @Override
        public void clip(int windingRule) {}

        @Override
        public void appendRectangle(Point2D p0, Point2D p1, Point2D p2, Point2D p3) {
            // Check for horizontal rectangle (line drawn as thin rectangle)
            float height = (float) Math.abs(p0.getY() - p2.getY());
            if (height < 3) { // Thin rectangle, treat as line
                float y = (float) ((p0.getY() + p2.getY()) / 2);
                float x1 = (float) Math.min(p0.getX(), p2.getX());
                float x2 = (float) Math.max(p0.getX(), p2.getX());

                float pageHeight = getPage().getMediaBox().getHeight();
                float docY = pageHeight - y;
                lines.add(new HorizontalLine(docY, x1, x2));
            }
        }
    }
}
